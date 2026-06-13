const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const genCode = (): string => {
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) code += CHARS[bytes[i] % CHARS.length];
  return code;
};

export const normalizeCode = (raw: string): string =>
  (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

export const formatCode = (code: string): string =>
  code ? `${code.slice(0, 3)}-${code.slice(3)}` : "";

export const codeFromText = (text: string): string | null => {
  const match = (text || "").match(/([A-Z0-9]{6})\s*$/i);
  return match ? match[1].toUpperCase() : null;
};
