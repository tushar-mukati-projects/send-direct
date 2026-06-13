import type { ReactNode } from "react";

interface ScreenTopBarProps {
  backLabel: string;
  onBack: () => void;
  right: ReactNode;
}

export const ScreenTopBar = ({ backLabel, onBack, right }: ScreenTopBarProps) => (
  <div className="flex items-center justify-between">
    <button
      type="button"
      onClick={onBack}
      className="text-muted hover:text-subtle-2 flex cursor-pointer items-center gap-1.5 p-0 text-[11px] tracking-[1px] transition-colors"
    >
      {backLabel}
    </button>
    {right}
  </div>
);
