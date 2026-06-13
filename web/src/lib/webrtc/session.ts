import { DATA_CHANNEL_LABEL, fetchIceServers, ICE_SERVERS } from "@/lib/webrtc/constants";
import { createPeerConnection } from "@/lib/webrtc/peer";
import { createFileReceiver } from "@/lib/webrtc/receiver";
import { createFileSender } from "@/lib/webrtc/sender";
import { createSignaling } from "@/lib/webrtc/signaling";
import type { ServerMessage } from "@/schemas/signaling";
import type { ManifestFile, SelectedFile } from "@/types";

const CONNECT_TIMEOUT_MS = 25_000;

export interface SessionCallbacks {
  onCode?: (code: string) => void;
  onPeerJoined?: () => void;
  onConnectStep?: (step: number) => void;
  onManifest?: (files: ManifestFile[]) => void;
  onAccepted?: () => void;
  onProgress?: (bytes: number) => void;
  onComplete?: () => void;
  onPeerLeft?: () => void;
  onError?: (message: string) => void;
}

export const createTransferSession = (callbacks: SessionCallbacks) => {
  let signaling: ReturnType<typeof createSignaling> | null = null;
  let pc: RTCPeerConnection | null = null;
  let sender: ReturnType<typeof createFileSender> | null = null;
  let receiver: ReturnType<typeof createFileReceiver> | null = null;
  const pendingCandidates: RTCIceCandidateInit[] = [];
  let remoteReady = false;
  let step = 0;
  let closed = false;
  let finished = false;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let iceServers: RTCIceServer[] = ICE_SERVERS;
  let icePromise: Promise<void> | null = null;

  const ensureIce = async (): Promise<void> => {
    if (!icePromise) {
      icePromise = fetchIceServers().then((servers) => {
        iceServers = servers;
      });
    }
    await icePromise;
  };

  const cancelTimeout = (): void => {
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
  };

  const setStep = (next: number): void => {
    if (next <= step) return;
    step = next;
    callbacks.onConnectStep?.(next);
  };

  const fail = (message: string): void => {
    if (closed || finished) return;
    callbacks.onError?.(message);
  };

  const markFinished = (): void => {
    finished = true;
    cancelTimeout();
    callbacks.onComplete?.();
  };

  const armTimeout = (): void => {
    if (connectTimer) return;
    connectTimer = setTimeout(() => {
      if (pc?.connectionState !== "connected") {
        fail("could not connect — this network may need a TURN relay");
      }
    }, CONNECT_TIMEOUT_MS);
  };

  const applyRemote = async (sdp: RTCSessionDescriptionInit): Promise<void> => {
    if (!pc) return;
    await pc.setRemoteDescription(sdp);
    remoteReady = true;
    const pending = pendingCandidates.splice(0);
    for (const candidate of pending) await pc.addIceCandidate(candidate).catch(() => {});
  };

  const addCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
    if (!pc || !remoteReady) {
      pendingCandidates.push(candidate);
      return;
    }
    await pc.addIceCandidate(candidate).catch(() => {});
  };

  const onPeerState = (connection: RTCPeerConnection): void => {
    const ice = connection.iceConnectionState;
    if (ice === "checking") setStep(2);
    if (ice === "connected" || ice === "completed") {
      cancelTimeout();
      setStep(3);
    }
    if (connection.connectionState === "connected") {
      cancelTimeout();
      setStep(4);
    }
    if (connection.connectionState === "failed" || ice === "failed") {
      fail("could not establish a direct connection");
    }
  };

  const attachReceiver = (channel: RTCDataChannel): void => {
    channel.addEventListener("open", () => cancelTimeout());
    receiver = createFileReceiver(channel, {
      onManifest: (files) => {
        setStep(4);
        callbacks.onManifest?.(files);
      },
      onProgress: (bytes) => callbacks.onProgress?.(bytes),
      onComplete: () => markFinished(),
      onError: (error) => fail(error),
    });
  };

  const createPc = (asReceiver = false): RTCPeerConnection => {
    pc?.close();
    const connection = createPeerConnection(
      {
        onIceCandidate: (candidate) =>
          signaling?.send({ type: "ice", candidate: candidate.toJSON() }),
        onStateChange: (current) => onPeerState(current),
        onDataChannel: asReceiver ? (channel) => attachReceiver(channel) : undefined,
      },
      iceServers,
    );
    pc = connection;
    return connection;
  };

  const makeOffer = async (files: SelectedFile[]): Promise<void> => {
    try {
      await ensureIce();
      const connection = createPc();
      const channel = connection.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true });
      sender = createFileSender(channel, files, {
        onAccepted: () => callbacks.onAccepted?.(),
        onDeclined: () => fail("your peer declined the transfer"),
        onProgress: (bytes) => callbacks.onProgress?.(bytes),
        onComplete: () => markFinished(),
        onError: (error) => fail(error),
      });
      channel.onopen = () => {
        cancelTimeout();
        sender?.sendManifest();
      };
      armTimeout();
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      signaling?.send({ type: "offer", sdp: offer });
    } catch {
      fail("could not create a connection offer");
    }
  };

  const answer = async (sdp: RTCSessionDescriptionInit): Promise<void> => {
    try {
      await ensureIce();
      const connection = pc ?? createPc(true);
      setStep(2);
      armTimeout();
      await applyRemote(sdp);
      const description = await connection.createAnswer();
      await connection.setLocalDescription(description);
      signaling?.send({ type: "answer", sdp: description });
    } catch {
      fail("could not answer the connection offer");
    }
  };

  const onSenderMessage = (message: ServerMessage, files: SelectedFile[]): void => {
    switch (message.type) {
      case "created":
        callbacks.onCode?.(message.code);
        break;
      case "peer-joined":
        callbacks.onPeerJoined?.();
        void makeOffer(files);
        break;
      case "answer":
        void applyRemote(message.sdp);
        break;
      case "ice":
        void addCandidate(message.candidate);
        break;
      case "peer-left":
        if (!finished) callbacks.onPeerLeft?.();
        break;
      case "error":
        fail(message.message);
        break;
      default:
        break;
    }
  };

  const onReceiverMessage = (message: ServerMessage): void => {
    switch (message.type) {
      case "joined":
        setStep(1);
        break;
      case "offer":
        void answer(message.sdp);
        break;
      case "ice":
        void addCandidate(message.candidate);
        break;
      case "peer-left":
        if (!finished) callbacks.onPeerLeft?.();
        break;
      case "error":
        fail(message.message);
        break;
      default:
        break;
    }
  };

  const startSend = (code: string, files: SelectedFile[]): void => {
    signaling = createSignaling({
      onOpen: () => signaling?.send({ type: "create", code }),
      onMessage: (message) => onSenderMessage(message, files),
      onError: (error) => fail(error),
    });
    signaling.connect(code);
  };

  const startReceive = (code: string): void => {
    setStep(1);
    signaling = createSignaling({
      onOpen: () => signaling?.send({ type: "join", code }),
      onMessage: (message) => onReceiverMessage(message),
      onError: (error) => fail(error),
    });
    signaling.connect(code);
  };

  const accept = (): void => {
    receiver?.accept();
  };

  const close = (): void => {
    if (closed) return;
    closed = true;
    cancelTimeout();
    sender?.cancel();
    signaling?.send({ type: "bye" });
    signaling?.close();
    pc?.close();
    signaling = null;
    pc = null;
    sender = null;
    receiver = null;
  };

  const decline = (): void => {
    receiver?.decline();
    close();
  };

  return { startSend, startReceive, accept, decline, close };
};
