"use client";

import { StatusDot } from "@/components/ui/StatusDot";
import { useTransferStore } from "@/stores/transfer-store";
import type { TransferView } from "@/types";

interface StatusPill {
  label: string;
  amber: boolean;
}

const statusFor = (view: TransferView, peerJoined: boolean): StatusPill => {
  switch (view) {
    case "recv-connecting":
      return { label: "NEGOTIATING", amber: true };
    case "transfer":
      return { label: "CHANNEL LIVE", amber: false };
    case "send-share":
      return peerJoined
        ? { label: "PEER JOINED", amber: false }
        : { label: "AWAITING PEER", amber: true };
    case "done":
      return { label: "COMPLETE", amber: false };
    default:
      return { label: "P2P READY", amber: false };
  }
};

export const Header = () => {
  const view = useTransferStore((store) => store.view);
  const peerJoined = useTransferStore((store) => store.peerJoined);
  const goHome = useTransferStore((store) => store.goHome);
  const status = statusFor(view, peerJoined);

  return (
    <header className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={goHome}
        className="flex cursor-pointer items-center gap-2.5 select-none"
      >
        <div
          className="border-accent flex h-[30px] w-[30px] items-center justify-center rounded-md border-[1.5px]"
          style={{ background: "rgba(62,240,160,.07)", boxShadow: "0 0 18px rgba(62,240,160,.18)" }}
        >
          <div
            className="h-[11px] w-[11px]"
            style={{
              borderRight: "2px solid #3ef0a0",
              borderBottom: "2px solid #3ef0a0",
              transform: "rotate(45deg) translate(-1px,-1px)",
            }}
          />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-bright text-base font-bold tracking-[0.3px]">
            Send<span className="text-accent">Direct</span>
          </span>
          <span className="text-dim mt-[3px] text-[9.5px] tracking-[2.5px]">P2P · WEBRTC</span>
        </div>
      </button>

      <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/2 px-[11px] py-1.5">
        <StatusDot amber={status.amber} className="h-[7px] w-[7px]" />
        <span className="text-subtle text-[10px] tracking-[1.5px]">{status.label}</span>
      </div>
    </header>
  );
};
