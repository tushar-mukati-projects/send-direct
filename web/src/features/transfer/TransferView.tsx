"use client";

import { useTransferProgress } from "@/hooks/transfer";
import { fileCountLabel, fmtSize, fmtTime } from "@/lib/format";

export const TransferView = () => {
  const { rows, total, transferredBytes, speed, progress, etaSecs, transferLabel, fileCount } =
    useTransferProgress();

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <span className="text-accent flex items-center gap-2 text-[11px] tracking-[1px]">
          <span className="animate-sd-pulse bg-accent h-[7px] w-[7px] rounded-full" />
          {transferLabel}
        </span>
        <span className="text-dim text-[10px] tracking-[1.5px]">🔒 ENCRYPTED</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="font-display text-bright text-[48px] leading-none font-bold">
          {Math.floor(progress)}
          <span className="text-muted text-[22px]">%</span>
        </div>
        <div className="flex flex-col gap-1 pb-1 text-right">
          <span className="text-accent text-[15px] font-medium">{speed.toFixed(1)} MB/s</span>
          <span className="text-muted text-[10px] tracking-[1px]">ETA {fmtTime(etaSecs)}</span>
        </div>
      </div>

      <div
        className="relative h-2 overflow-hidden rounded-md bg-white/6"
        role="progressbar"
        aria-valuenow={Math.floor(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="relative h-full overflow-hidden rounded-md transition-[width] duration-100 ease-linear"
          style={{
            width: `${progress.toFixed(1)}%`,
            background: "linear-gradient(90deg,#1f8a5b,#3ef0a0)",
          }}
        >
          <div
            className="animate-sd-shimmer absolute inset-0 w-2/5"
            style={{
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)",
            }}
          />
        </div>
      </div>

      <div className="text-dim flex justify-between text-[10px] tracking-[0.5px]">
        <span>
          {fmtSize(transferredBytes)} / {fmtSize(total)}
        </span>
        <span>{fileCountLabel(fileCount)}</span>
      </div>

      <div className="flex max-h-[200px] flex-col gap-2 overflow-auto">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-[11px] rounded-lg border border-white/6 bg-white/[0.015] px-3 py-[9px]"
          >
            <span className="w-[18px] shrink-0 text-center text-xs" style={{ color: row.dotColor }}>
              {row.dot}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <span className="flex justify-between gap-2.5">
                <span className="text-subtle-2 truncate text-[11.5px]">{row.name}</span>
                <span className="text-muted shrink-0 text-[10px]">{row.pctLabel}</span>
              </span>
              <span className="block h-[3px] overflow-hidden rounded-[3px] bg-white/6">
                <span
                  className="bg-accent block h-full transition-[width] duration-100 ease-linear"
                  style={{ width: row.barWidth }}
                />
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
