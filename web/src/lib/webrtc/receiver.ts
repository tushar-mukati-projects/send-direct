import { dataControlSchema, type DataControl } from "@/schemas/signaling";
import type { ManifestFile } from "@/types";

interface ReceiverCallbacks {
  onManifest: (files: ManifestFile[]) => void;
  onProgress: (receivedBytes: number) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}

interface IncomingFile {
  meta: ManifestFile;
  chunks: ArrayBuffer[];
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

  const post = (message: DataControl): void => {
    if (channel.readyState === "open") channel.send(JSON.stringify(message));
  };

  const settle = (error?: string): void => {
    if (settled) return;
    settled = true;
    if (error) callbacks.onError(error);
    else callbacks.onComplete();
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
      files.set(meta.id, { meta, chunks: [], received: 0, complete: false });
      order.push(meta.id);
    }
    callbacks.onManifest(manifestFiles);
  };

  const finishFile = (id: string): void => {
    const file = files.get(id);
    if (!file) return;
    if (file.received !== file.meta.size) {
      settle(`“${file.meta.name}” arrived incomplete`);
      return;
    }
    try {
      downloadBlob(new Blob(file.chunks), file.meta.name);
    } catch {
      settle("failed to save a received file");
      return;
    }
    file.complete = true;
    file.chunks = [];
    if (currentId === id) currentId = null;
  };

  const complete = (): void => {
    if (settled) return;
    if (!order.every((id) => files.get(id)?.complete)) {
      settle("the transfer ended before all files arrived");
      return;
    }
    emitProgress(true);
    settle();
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
        currentId = message.id;
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
    if (!file) return;
    file.chunks.push(data);
    file.received += data.byteLength;
    receivedBytes += data.byteLength;
    emitProgress();
  };

  channel.binaryType = "arraybuffer";
  channel.onmessage = (event) => onMessage(event);
  channel.onclose = () => {
    if (order.length > 0 && order.every((id) => files.get(id)?.complete)) settle();
    else settle("connection closed before the transfer finished");
  };

  const accept = (): void => {
    post({ t: "accept" });
  };

  const decline = (): void => {
    post({ t: "decline" });
  };

  return { accept, decline };
};
