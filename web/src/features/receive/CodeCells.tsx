interface CodeCellsProps {
  value: string;
}

export const CodeCells = ({ value }: CodeCellsProps) => (
  <div className="grid grid-cols-6 gap-2">
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const filled = i < value.length;
      const active = i === value.length;
      return (
        <div
          key={i}
          className="font-display text-accent flex h-[60px] items-center justify-center rounded-[10px] text-[26px] font-bold"
          style={{
            border: active
              ? "2px solid #3ef0a0"
              : `1.5px solid ${filled ? "#3ef0a0" : "rgba(255,255,255,.12)"}`,
            background: filled
              ? "rgba(62,240,160,.07)"
              : active
                ? "rgba(62,240,160,.12)"
                : "rgba(255,255,255,.02)",
          }}
        >
          {value[i] ?? ""}
        </div>
      );
    })}
  </div>
);
