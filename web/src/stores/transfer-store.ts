import { toast } from "sonner";
import { create } from "zustand";
import { genCode, normalizeCode } from "@/lib/code";
import { linkForCode } from "@/lib/webrtc/constants";
import { createTransferSession } from "@/lib/webrtc/session";
import type { ManifestFile, SelectedFile, TransferMode, TransferView } from "@/types";

type CopiedTarget = "" | "code" | "link";

interface TransferState {
  view: TransferView;
  mode: TransferMode | null;
  files: SelectedFile[];
  incoming: ManifestFile[];
  code: string;
  codeInput: string;
  peerJoined: boolean;
  connectStep: number;
  copied: CopiedTarget;
  transferredBytes: number;
  curSpeed: number;
  elapsed: number;

  goHome: () => void;
  openSend: () => void;
  openReceive: (prefillCode?: string) => void;
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  continueToShare: () => void;
  copyCode: () => void;
  copyLink: () => void;
  setCodeInput: (value: string) => void;
  submitCode: () => void;
  accept: () => void;
  decline: () => void;
  doneAgain: () => void;
}

let session: ReturnType<typeof createTransferSession> | null = null;
let transferStart = 0;
let sampleTime = 0;
let sampleBytes = 0;

const resetState = {
  mode: null,
  files: [],
  incoming: [],
  code: "",
  codeInput: "",
  peerJoined: false,
  connectStep: 0,
  copied: "" as CopiedTarget,
  transferredBytes: 0,
  curSpeed: 0,
  elapsed: 0,
};

const fileId = () =>
  `${Date.now().toString(36)}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

export const useTransferStore = create<TransferState>((set, get) => {
  const closeSession = () => {
    session?.close();
    session = null;
  };

  const beginTransfer = (mode: TransferMode) => {
    transferStart = performance.now();
    sampleTime = transferStart;
    sampleBytes = 0;
    set({ view: "transfer", mode, transferredBytes: 0, curSpeed: 0, elapsed: 0 });
  };

  const handleProgress = (bytes: number) => {
    const now = performance.now();
    const dt = (now - sampleTime) / 1000;
    if (dt > 0) {
      const instant = (bytes - sampleBytes) / 1e6 / dt;
      const prev = get().curSpeed;
      const smoothed = prev > 0 ? prev * 0.7 + instant * 0.3 : instant;
      sampleTime = now;
      sampleBytes = bytes;
      set({ transferredBytes: bytes, curSpeed: Math.max(0, smoothed) });
    } else {
      set({ transferredBytes: bytes });
    }
  };

  const handleComplete = () => {
    const elapsed = (performance.now() - transferStart) / 1000;
    set({ elapsed });
    setTimeout(() => set({ view: "done" }), 450);
  };

  const fail = (message: string) => {
    toast.error(message);
    get().goHome();
  };

  return {
    view: "home",
    ...resetState,

    goHome: () => {
      closeSession();
      set({ view: "home", ...resetState });
    },

    openSend: () => {
      closeSession();
      set({ ...resetState, view: "send-select", mode: "send" });
    },

    openReceive: (prefillCode = "") => {
      closeSession();
      set({
        ...resetState,
        view: "recv-enter",
        mode: "receive",
        codeInput: normalizeCode(prefillCode),
      });
    },

    addFiles: (incomingFiles) => {
      const mapped: SelectedFile[] = Array.from(incomingFiles).map((file) => ({
        id: fileId(),
        file,
        name: file.name,
        size: file.size,
      }));
      if (!mapped.length) return;
      set((state) => ({ files: [...state.files, ...mapped] }));
    },

    removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),

    continueToShare: () => {
      const { files } = get();
      if (!files.length) return;
      const code = genCode();
      set({ view: "send-share", code, peerJoined: false });
      session = createTransferSession({
        onCode: (value) => set({ code: value }),
        onPeerJoined: () => set({ peerJoined: true }),
        onAccepted: () => beginTransfer("send"),
        onProgress: handleProgress,
        onComplete: handleComplete,
        onPeerLeft: () => fail("your peer disconnected"),
        onError: fail,
      });
      session.startSend(code, files);
    },

    copyCode: () => {
      const { code } = get();
      navigator.clipboard?.writeText(code).catch(() => {});
      set({ copied: "code" });
      setTimeout(() => set({ copied: "" }), 1600);
    },

    copyLink: () => {
      const { code } = get();
      navigator.clipboard?.writeText(linkForCode(code)).catch(() => {});
      set({ copied: "link" });
      setTimeout(() => set({ copied: "" }), 1600);
    },

    setCodeInput: (value) => set({ codeInput: normalizeCode(value) }),

    submitCode: () => {
      const code = get().codeInput;
      if (code.length < 6) return;
      set({ view: "recv-connecting", code, connectStep: 0 });
      session = createTransferSession({
        onConnectStep: (step) => set({ connectStep: step }),
        onManifest: (files) => set({ view: "recv-incoming", incoming: files }),
        onProgress: handleProgress,
        onComplete: handleComplete,
        onPeerLeft: () => fail("the sender disconnected"),
        onError: fail,
      });
      session.startReceive(code);
    },

    accept: () => {
      session?.accept();
      beginTransfer("receive");
    },

    decline: () => {
      session?.decline();
      get().goHome();
    },

    doneAgain: () => {
      const mode = get().mode;
      if (mode === "receive") get().openReceive();
      else get().openSend();
    },
  };
});
