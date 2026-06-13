import { BUFFER_HIGH, BUFFER_LOW, CHUNK_SIZE } from "@/lib/webrtc/constants";
import { dataControlSchema, type DataControl } from "@/schemas/signaling";
import type { SelectedFile } from "@/types";

interface SenderCallbacks {
  onAccepted: () => void;
  onDeclined: () => void;
  onProgress: (sentBytes: number) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}

const PROGRESS_INTERVAL_MS = 60;
const FLUSH_TIMEOUT_MS = 15_000;
const DRAIN_TIMEOUT_MS = 30_000;

export const createFileSender = (
  channel: RTCDataChannel,
  files: SelectedFile[],
  callbacks: SenderCallbacks,
) => {
  let sentBytes = 0;
  let lastEmit = 0;
  let cancelled = false;

  const post = (message: DataControl): void => {
    if (channel.readyState === "open") channel.send(JSON.stringify(message));
  };

  const emitProgress = (force = false): void => {
    const now = performance.now();
    if (force || now - lastEmit >= PROGRESS_INTERVAL_MS) {
      lastEmit = now;
      callbacks.onProgress(sentBytes);
    }
  };

  const drain = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (channel.readyState !== "open" || channel.bufferedAmount < BUFFER_HIGH) {
        resolve();
        return;
      }
      const cleanup = () => {
        clearTimeout(timer);
        channel.removeEventListener("bufferedamountlow", onDrain);
        channel.removeEventListener("close", onDrain);
        channel.removeEventListener("error", onDrain);
      };
      const onDrain = () => {
        cleanup();
        resolve();
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("drain timeout"));
      }, DRAIN_TIMEOUT_MS);
      channel.addEventListener("bufferedamountlow", onDrain);
      channel.addEventListener("close", onDrain);
      channel.addEventListener("error", onDrain);
    });
  };

  const flush = async (): Promise<void> => {
    const start = performance.now();
    while (channel.readyState === "open" && channel.bufferedAmount > 0) {
      if (performance.now() - start > FLUSH_TIMEOUT_MS) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const streamAll = async (): Promise<void> => {
    try {
      for (const item of files) {
        post({ t: "file-begin", id: item.id });
        let offset = 0;
        while (offset < item.size) {
          if (cancelled || channel.readyState !== "open") {
            throw new Error("channel closed");
          }
          if (channel.bufferedAmount >= BUFFER_HIGH) await drain();
          const slice = item.file.slice(offset, offset + CHUNK_SIZE);
          const chunk = await slice.arrayBuffer();
          channel.send(chunk);
          offset += chunk.byteLength;
          sentBytes += chunk.byteLength;
          emitProgress();
        }
        post({ t: "file-end", id: item.id });
      }
      emitProgress(true);
      post({ t: "all-done" });
      await flush();
      callbacks.onComplete();
    } catch {
      if (cancelled) return;
      post({ t: "abort" });
      callbacks.onError("the transfer failed while sending");
    }
  };

  const onControl = (event: MessageEvent<string | ArrayBuffer>): void => {
    if (typeof event.data !== "string") return;
    const data = event.data;
    let result: ReturnType<typeof dataControlSchema.safeParse>;
    try {
      result = dataControlSchema.safeParse(JSON.parse(data));
    } catch {
      return;
    }
    if (!result.success) return;
    if (result.data.t === "accept") {
      callbacks.onAccepted();
      void streamAll();
    } else if (result.data.t === "decline") {
      callbacks.onDeclined();
    }
  };

  channel.binaryType = "arraybuffer";
  channel.bufferedAmountLowThreshold = BUFFER_LOW;
  channel.onmessage = (event) => onControl(event);

  const sendManifest = (): void => {
    post({
      t: "manifest",
      files: files.map(({ id, name, size }) => ({ id, name, size })),
    });
  };

  const cancel = (): void => {
    cancelled = true;
  };

  return { sendManifest, cancel };
};
