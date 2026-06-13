import { sumSizes } from "@/lib/format";
import { useTransferStore } from "@/stores/transfer-store";

export interface FileProgressRow {
  id: string;
  name: string;
  pctLabel: string;
  barWidth: string;
  dot: string;
  dotColor: string;
}

export interface TransferProgress {
  rows: FileProgressRow[];
  total: number;
  transferredBytes: number;
  speed: number;
  progress: number;
  etaSecs: number;
  transferLabel: string;
  fileCount: number;
}

export const useTransferProgress = (): TransferProgress => {
  const mode = useTransferStore((s) => s.mode);
  const files = useTransferStore((s) => s.files);
  const incoming = useTransferStore((s) => s.incoming);
  const transferredBytes = useTransferStore((s) => s.transferredBytes);
  const speed = useTransferStore((s) => s.curSpeed);

  const list = mode === "receive" ? incoming : files;
  const total = sumSizes(list);

  const rows = list.map((file, i) => {
    const start = list.slice(0, i).reduce((sum, prev) => sum + prev.size, 0);
    const filled = Math.max(0, Math.min(file.size, transferredBytes - start));
    const pct = file.size ? (filled / file.size) * 100 : 100;
    const done = pct >= 99.9;
    return {
      id: file.id,
      name: file.name,
      pctLabel: `${Math.round(pct)}%`,
      barWidth: `${pct.toFixed(1)}%`,
      dot: done ? "✓" : "↓",
      dotColor: done ? "#3ef0a0" : "#51606b",
    };
  });

  const progress = total ? Math.min(100, (transferredBytes / total) * 100) : 0;
  const etaSecs = speed > 0 ? Math.max(0, total - transferredBytes) / (speed * 1e6) : 0;

  return {
    rows,
    total,
    transferredBytes,
    speed,
    progress,
    etaSecs,
    transferLabel: mode === "receive" ? "DOWNLOADING" : "SENDING TO PEER",
    fileCount: list.length,
  };
};
