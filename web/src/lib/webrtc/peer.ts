import { ICE_SERVERS } from "@/lib/webrtc/constants";

interface PeerHandlers {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onStateChange: (pc: RTCPeerConnection) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
}

export const createPeerConnection = (handlers: PeerHandlers): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  pc.onicecandidate = (event) => {
    if (event.candidate) handlers.onIceCandidate(event.candidate);
  };
  pc.onconnectionstatechange = () => handlers.onStateChange(pc);
  pc.oniceconnectionstatechange = () => handlers.onStateChange(pc);
  if (handlers.onDataChannel) {
    pc.ondatachannel = (event) => handlers.onDataChannel?.(event.channel);
  }
  return pc;
};
