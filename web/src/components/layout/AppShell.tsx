"use client";

import { useEffect, useRef } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { TerminalBackdrop } from "@/components/layout/TerminalBackdrop";
import { HomeView } from "@/features/home/HomeView";
import { ConnectingView } from "@/features/receive/ConnectingView";
import { IncomingView } from "@/features/receive/IncomingView";
import { ReceiveEnterView } from "@/features/receive/ReceiveEnterView";
import { SendSelectView } from "@/features/send/SendSelectView";
import { SendShareView } from "@/features/send/SendShareView";
import { DoneView } from "@/features/transfer/DoneView";
import { TransferView } from "@/features/transfer/TransferView";
import { useTransferStore } from "@/stores/transfer-store";

const views = {
  home: HomeView,
  "send-select": SendSelectView,
  "send-share": SendShareView,
  "recv-enter": ReceiveEnterView,
  "recv-connecting": ConnectingView,
  "recv-incoming": IncomingView,
  transfer: TransferView,
  done: DoneView,
} as const;

interface AppShellProps {
  prefillCode?: string;
}

export const AppShell = ({ prefillCode }: AppShellProps) => {
  const view = useTransferStore((store) => store.view);
  const openReceive = useTransferStore((store) => store.openReceive);
  const ActiveView = views[view];
  const prefilled = useRef(false);

  useEffect(() => {
    if (prefillCode && !prefilled.current) {
      prefilled.current = true;
      openReceive(prefillCode);
    }
  }, [prefillCode, openReceive]);

  return (
    <div className="bg-bg relative min-h-screen w-full">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <TerminalBackdrop />
      </div>
      <div className="relative z-[2] flex min-h-screen w-full items-center justify-center px-[18px] py-8">
        <div className="sd-stage flex flex-col gap-4">
          <Header />
          <main
            key={view}
            className="animate-sd-up relative overflow-hidden rounded-[14px] border border-white/8 p-6"
            style={{
              background: "linear-gradient(180deg,rgba(16,21,27,.92),rgba(9,12,16,.92))",
              boxShadow: "0 30px 80px -30px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.04)",
            }}
          >
            <ActiveView />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
