import { extOf, fmtSize } from "@/lib/format";

interface FileRowProps {
  name: string;
  size: number;
  onRemove?: () => void;
}

export const FileRow = ({ name, size, onRemove }: FileRowProps) => (
  <div className="flex items-center gap-[11px] rounded-lg border border-white/7 bg-white/2 px-3 py-2.5">
    <span className="bg-accent/10 text-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-semibold tracking-[0.5px]">
      {extOf(name)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-ink truncate text-[12.5px]">{name}</span>
      <span className="text-muted text-[10px]">{fmtSize(size)}</span>
    </span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="text-dim hover:text-danger cursor-pointer p-1 text-base leading-none transition-colors"
      >
        ×
      </button>
    )}
  </div>
);
