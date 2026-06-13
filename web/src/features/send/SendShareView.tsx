"use client";

import { ScreenTopBar } from "@/components/layout/ScreenTopBar";
import { StatusDot } from "@/components/ui/StatusDot";
import { ShareQr } from "@/features/send/ShareQr";
import { formatCode } from "@/lib/code";
import { fileCountLabel, fmtSize, sumSizes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { linkForCode } from "@/lib/webrtc/constants";
import { useTransferStore } from "@/stores/transfer-store";

export const SendShareView = () => {
  const code = useTransferStore((s) => s.code);
  const copied = useTransferStore((s) => s.copied);
  const peerJoined = useTransferStore((s) => s.peerJoined);
  const files = useTransferStore((s) => s.files);
  const copyCode = useTransferStore((s) => s.copyCode);
  const copyLink = useTransferStore((s) => s.copyLink);
  const goHome = useTransferStore((s) => s.goHome);

  const total = sumSizes(files);
  const linkDisplay = linkForCode(code).replace(/^https?:\/\//, "");

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenTopBar
        backLabel="← CANCEL"
        onBack={goHome}
        right={<span className="text-accent text-[10px] tracking-[2px]">SEND · 02 / SHARE</span>}
      />

      <div className="flex flex-col gap-1.5 text-center">
        <span className="text-muted text-[11px] tracking-[1px]">share this with your peer</span>
        <div
          className="font-display text-accent text-[36px] font-bold tracking-[5px] whitespace-nowrap"
          style={{ textShadow: "0 0 24px rgba(62,240,160,.35)" }}
        >
          {formatCode(code)}
        </div>
      </div>

      <div className="flex items-stretch gap-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
          <button
            type="button"
            onClick={copyCode}
            className="border-accent/30 bg-accent/6 text-accent hover:bg-accent/12 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border p-[11px] text-[11px] tracking-[1px] transition-colors"
          >
            {copied === "code" ? "✓ COPIED" : "⧉ COPY CODE"}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full min-w-0 cursor-pointer flex-col items-center gap-[3px] rounded-lg border border-white/10 bg-white/2 p-[11px] transition-colors hover:border-white/25"
          >
            <span className="text-dim text-[9px] tracking-[1.5px]">
              {copied === "link" ? "✓ COPIED LINK" : "SHARE LINK"}
            </span>
            <span className="text-subtle max-w-full truncate text-[11px]">{linkDisplay}</span>
          </button>
        </div>
        <ShareQr code={code} />
      </div>

      <div className="flex items-center gap-2.5 border-t border-white/6 pt-3.5">
        <StatusDot amber={!peerJoined} className="h-2 w-2 shrink-0" />
        <span className={cn("flex-1 text-[12px]", peerJoined ? "text-accent" : "text-subtle")}>
          {peerJoined ? "peer connected — opening channel" : "waiting for peer to connect"}
          {!peerJoined && <span className="animate-sd-blink text-accent">_</span>}
        </span>
        <span className="text-dim text-[10px]">
          {fileCountLabel(files.length)} · {fmtSize(total)}
        </span>
      </div>
    </div>
  );
};
