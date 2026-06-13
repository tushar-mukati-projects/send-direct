"use client";

import { Button } from "@/components/ui/button";
import { fmtSize, fmtTime, sumSizes } from "@/lib/format";
import { useTransferStore } from "@/stores/transfer-store";

export const DoneView = () => {
  const mode = useTransferStore((s) => s.mode);
  const files = useTransferStore((s) => s.files);
  const incoming = useTransferStore((s) => s.incoming);
  const elapsed = useTransferStore((s) => s.elapsed);
  const goHome = useTransferStore((s) => s.goHome);
  const doneAgain = useTransferStore((s) => s.doneAgain);

  const isReceive = mode === "receive";
  const list = isReceive ? incoming : files;
  const total = sumSizes(list);

  const stats = [
    { label: "FILES", value: String(list.length) },
    { label: "SIZE", value: fmtSize(total) },
    { label: "TIME", value: fmtTime(elapsed) },
  ];

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div
        className="border-accent bg-accent/10 text-accent mt-1.5 flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] text-[30px]"
        style={{ boxShadow: "0 0 30px rgba(62,240,160,.25)" }}
      >
        ✓
      </div>
      <div>
        <h2 className="font-display text-bright text-[22px] font-bold">
          {isReceive ? "Download complete" : "Transfer complete"}
        </h2>
        <p className="text-muted mt-1.5 text-[12px]">
          {isReceive
            ? "Files saved directly to your device."
            : "Your peer received every file, encrypted end-to-end."}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-lg border border-white/7 px-2 py-3"
          >
            <span className="text-dim text-[9px] tracking-[1px]">{stat.label}</span>
            <span className="font-display text-ink text-[17px] font-semibold">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full gap-2.5">
        <Button variant="ghost" onClick={goHome} className="flex-1 p-[13px] text-[12px]">
          DONE
        </Button>
        <Button variant="accentSoft" onClick={doneAgain} className="flex-1 p-[13px] text-[12px]">
          {isReceive ? "RECEIVE MORE" : "SEND MORE"}
        </Button>
      </div>
    </div>
  );
};
