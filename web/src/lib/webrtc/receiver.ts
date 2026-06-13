import { STREAM_THRESHOLD } from "@/lib/webrtc/constants";
import { dataControlSchema, type DataControl } from "@/schemas/signaling";
import type { ManifestFile } from "@/types";

interface WritableLike {
  write(data: ArrayBuffer): Promise<void>;
  close(): Promise<void>;
}

interface FileHandleLike {
  createWritable(): Promise<WritableLike>;
}

interface DirectoryHandleLike {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
  }
}

interface ReceiverCallbacks {
  onManifest: (files: ManifestFile[]) => void;
  onProgress: (receivedBytes: number) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}

interface IncomingFile {
  meta: ManifestFile;
  chunks: ArrayBuffer[];
  writable: WritableLike | null;
  received: number;
  complete: boolean;
}

const PROGRESS_INTERVAL_MS = 60;

export const createFileReceiver = (channel: RTCDataChannel, callbacks: ReceiverCallbacks) => {
  const files = new Map<string, IncomingFile>();
  let order: string[] = [];
  let currentId: string | null = null;
  let receivedBytes = 0;
  let lastEmit = 0;
  let settled = false;
  let directory: DirectoryHandleLike | null = null;
  let writeTail: Promise<void> = Promise.resolve();

  const post = (message: DataControl): void => {
    if (channel.readyState === "open") channel.send(JSON.stringify(message));
  };

  const settle = (error?: string): void => {
    if (settled) return;
    settled = true;
    if (error) callbacks.onError(error);
    else callbacks.onComplete();
  };

  const enqueue = (task: () => Promise<void>): void => {
    writeTail = writeTail.then(task).catch(() => settle("failed to save a received file"));
  };

  const emitProgress = (force = false): void => {
    const now = performance.now();
    if (force || now - lastEmit >= PROGRESS_INTERVAL_MS) {
      lastEmit = now;
      callbacks.onProgress(receivedBytes);
    }
  };

  const downloadBlob = (blob: Blob, name: string): void => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const registerManifest = (manifestFiles: ManifestFile[]): void => {
    files.clear();
    order = [];
    for (const meta of manifestFiles) {
      files.set(meta.id, { meta, chunks: [], writable: null, received: 0, complete: false });
      order.push(meta.id);
    }
    callbacks.onManifest(manifestFiles);
  };

  const totalSize = (): number =>
    order.reduce((sum, id) => sum + (files.get(id)?.meta.size ?? 0), 0);

  const beginFile = (id: string): void => {
    currentId = id;
    const file = files.get(id);
    if (!file || !directory) return;
    const dir = directory;
    enqueue(async () => {
      const handle = await dir.getFileHandle(file.meta.name, { create: true });
      file.writable = await handle.createWritable();
    });
  };

  const writeChunk = (file: IncomingFile, data: ArrayBuffer): void => {
    file.received += data.byteLength;
    receivedBytes += data.byteLength;
    emitProgress();
    if (directory) {
      enqueue(async () => {
        await file.writable?.write(data);
      });
    } else {
      file.chunks.push(data);
    }
  };

  const finishFile = (id: string): void => {
    const file = files.get(id);
    if (!file) return;
    if (currentId === id) currentId = null;
    if (directory) {
      enqueue(async () => {
        await file.writable?.close();
        if (file.received !== file.meta.size)
          return settle(`“${file.meta.name}” arrived incomplete`);
        file.complete = true;
      });
      return;
    }
    if (file.received !== file.meta.size) return settle(`“${file.meta.name}” arrived incomplete`);
    try {
      downloadBlob(new Blob(file.chunks), file.meta.name);
    } catch {
      return settle("failed to save a received file");
    }
    file.complete = true;
    file.chunks = [];
  };

  const verifyComplete = (): void => {
    if (settled) return;
    if (!order.every((id) => files.get(id)?.complete)) {
      settle("the transfer ended before all files arrived");
      return;
    }
    emitProgress(true);
    settle();
  };

  const complete = (): void => {
    if (directory) enqueue(async () => verifyComplete());
    else verifyComplete();
  };

  const onControl = (raw: string): void => {
    let result: ReturnType<typeof dataControlSchema.safeParse>;
    try {
      result = dataControlSchema.safeParse(JSON.parse(raw));
    } catch {
      return;
    }
    if (!result.success) return;
    const message = result.data;
    switch (message.t) {
      case "manifest":
        registerManifest(message.files);
        break;
      case "file-begin":
        beginFile(message.id);
        break;
      case "file-end":
        finishFile(message.id);
        break;
      case "all-done":
        complete();
        break;
      case "abort":
        settle("the sender cancelled the transfer");
        break;
      default:
        break;
    }
  };

  const onMessage = (event: MessageEvent<string | ArrayBuffer>): void => {
    const data = event.data;
    if (typeof data === "string") {
      onControl(data);
      return;
    }
    if (settled || !currentId) {
      if (!settled) settle("received unexpected data — transfer aborted");
      return;
    }
    const file = files.get(currentId);
    if (file) writeChunk(file, data);
  };

  channel.binaryType = "arraybuffer";
  channel.onmessage = (event) => onMessage(event);
  channel.onclose = () => {
    const check = (): void => {
      if (order.length > 0 && order.every((id) => files.get(id)?.complete)) settle();
      else settle("connection closed before the transfer finished");
    };
    if (directory) enqueue(async () => check());
    else check();
  };

  const accept = async (): Promise<void> => {
    if (
      totalSize() >= STREAM_THRESHOLD &&
      typeof window !== "undefined" &&
      window.showDirectoryPicker
    ) {
      try {
        directory = await window.showDirectoryPicker();
      } catch {
        directory = null;
      }
    }
    post({ t: "accept" });
  };

  const decline = (): void => {
    post({ t: "decline" });
  };

  return { accept, decline };
};
