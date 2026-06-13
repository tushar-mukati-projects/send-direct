"use client";

import { useTransferStore } from "@/stores/transfer-store";

const chips = ["no account", "end‑to‑end encrypted", "works in any browser"];

export const HomeView = () => {
  const openSend = useTransferStore((s) => s.openSend);
  const openReceive = useTransferStore((s) => s.openReceive);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <span className="text-accent text-[10px] tracking-[3px]">{"// DIRECT TRANSFER"}</span>
        <h1 className="font-display text-bright text-[27px] leading-[1.12] font-bold">
          Move files browser‑to‑browser.
          <br />
          <span className="text-[#7e8b97]">No upload. No cloud.</span>
        </h1>
        <p className="text-muted max-w-[42ch] text-[12.5px] leading-[1.6]">
          Files travel over an encrypted WebRTC channel straight from your device to your
          peer&apos;s. Nothing is stored on a server.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={openSend}
          className="border-accent/30 bg-accent/5 hover:border-accent hover:bg-accent/10 flex cursor-pointer flex-col gap-3 rounded-[10px] border p-4 text-left transition-all hover:-translate-y-0.5"
        >
          <span className="border-accent/30 bg-accent/12 text-accent flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border text-lg">
            ↑
          </span>
          <span className="flex flex-col gap-[3px]">
            <span className="font-display text-bright text-base font-semibold">Send</span>
            <span className="text-muted text-[11px] leading-[1.4]">
              Pick files, share a code or link
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => openReceive()}
          className="flex cursor-pointer flex-col gap-3 rounded-[10px] border border-white/10 bg-white/2 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/28 hover:bg-white/5"
        >
          <span className="text-subtle-2 flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-white/14 bg-white/5 text-lg">
            ↓
          </span>
          <span className="flex flex-col gap-[3px]">
            <span className="font-display text-bright text-base font-semibold">Receive</span>
            <span className="text-muted text-[11px] leading-[1.4]">
              Enter a code or paste a link
            </span>
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/6 pt-4">
        {chips.map((chip) => (
          <span
            key={chip}
            className="text-dim rounded-[5px] border border-white/7 px-[9px] py-[5px] text-[10px] tracking-[0.5px]"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
};
