interface PeerHandlers {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onStateChange: (pc: RTCPeerConnection) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
}

export const createPeerConnection = (
  handlers: PeerHandlers,
  iceServers: RTCIceServer[],
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers });
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
