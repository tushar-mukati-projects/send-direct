"use client";

import { ScreenTopBar } from "@/components/layout/ScreenTopBar";
import { Button } from "@/components/ui/button";
import { FileRow } from "@/features/shared/FileRow";
import { formatCode } from "@/lib/code";
import { fileCountLabel, fmtSize, sumSizes } from "@/lib/format";
import { useTransferStore } from "@/stores/transfer-store";

export const IncomingView = () => {
  const code = useTransferStore((s) => s.code);
  const incoming = useTransferStore((s) => s.incoming);
  const accept = useTransferStore((s) => s.accept);
  const decline = useTransferStore((s) => s.decline);

  const total = sumSizes(incoming);

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenTopBar
        backLabel="← CANCEL"
        onBack={decline}
        right={<span className="text-accent text-[10px] tracking-[2px]">● CONNECTED</span>}
      />

      <div className="flex flex-col gap-1">
        <span className="text-muted text-[11px] tracking-[1px]">
          incoming from peer {formatCode(code)}
        </span>
        <h2 className="font-display text-bright text-[19px] font-semibold">
          {fileCountLabel(incoming.length)} · {fmtSize(total)}
        </h2>
      </div>

      <div className="flex max-h-[230px] flex-col gap-2 overflow-auto">
        {incoming.map((file) => (
          <FileRow key={file.id} name={file.name} size={file.size} />
        ))}
      </div>

      <div className="flex gap-2.5">
        <Button variant="danger" onClick={decline} className="px-[18px] py-3.5 text-[12px]">
          DECLINE
        </Button>
        <Button onClick={accept} className="flex-1 py-3.5 text-[12px]">
          ↓ ACCEPT & DOWNLOAD
        </Button>
      </div>
    </div>
  );
};
