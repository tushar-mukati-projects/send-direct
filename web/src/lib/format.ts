export const fmtSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return "0 B";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${Math.round(bytes)} B`;
};

export const fmtTime = (seconds: number): string => {
  let s = seconds;
  if (!Number.isFinite(s) || s < 0) s = 0;
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}m ${sec < 10 ? "0" : ""}${sec}s`;
  }
  return `${Math.max(0, Math.ceil(s))}s`;
};

export const extOf = (name: string): string => {
  const part = (name || "").split(".").pop();
  if (!part || part === name) return "FILE";
  return part.slice(0, 4).toUpperCase();
};

export const fileCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "file" : "files"}`;

export const sumSizes = (files: { size: number }[]): number =>
  files.reduce((total, file) => total + file.size, 0);
