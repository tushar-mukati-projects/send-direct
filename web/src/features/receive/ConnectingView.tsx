"use client";

import { formatCode } from "@/lib/code";
import { useTransferStore } from "@/stores/transfer-store";

const STEP_LABELS = [
  "locating peer via relay",
  "exchanging ICE candidates",
  "DTLS handshake · key exchange",
  "secure channel established",
];

export const ConnectingView = () => {
  const code = useTransferStore((s) => s.code);
  const connectStep = useTransferStore((s) => s.connectStep);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3.5 pt-2">
        <div
          className="animate-sd-spin h-[54px] w-[54px] rounded-full"
          style={{ border: "2px solid rgba(62,240,160,.15)", borderTopColor: "#3ef0a0" }}
        />
        <div className="text-center">
          <div className="font-display text-bright text-base font-semibold">
            Establishing P2P channel
          </div>
          <div className="text-muted mt-[3px] text-[11px]">
            connecting to peer <span className="text-accent">{formatCode(code)}</span>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col gap-[11px] rounded-[10px] border border-white/7 px-4 py-3.5"
        style={{ background: "rgba(0,0,0,.25)" }}
      >
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isDone = connectStep > stepNumber || connectStep === 4;
          const reached = connectStep >= stepNumber;
          const icon = isDone ? "✓" : reached ? "▸" : "·";
          const iconColor = isDone ? "#3ef0a0" : reached ? "#ffc05a" : "#51606b";
          const textColor = isDone ? "#cdd7df" : reached ? "#e6edf2" : "#51606b";
          return (
            <div
              key={label}
              className="flex items-center gap-2.5 text-[11.5px]"
              style={{ color: textColor }}
            >
              <span className="w-[15px] shrink-0 text-center" style={{ color: iconColor }}>
                {icon}
              </span>
              <span className="flex-1">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
