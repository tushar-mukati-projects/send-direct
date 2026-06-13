export const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL ?? "ws://localhost:8787";

export const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN ??
  (typeof window !== "undefined" ? window.location.origin : "https://send.direct");

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  ...(process.env.NEXT_PUBLIC_TURN_URL
    ? [
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
        },
      ]
    : []),
];

export const CHUNK_SIZE = 16 * 1024;

export const BUFFER_HIGH = 8 * 1024 * 1024;
export const BUFFER_LOW = 1 * 1024 * 1024;

export const DATA_CHANNEL_LABEL = "send-direct";

export const linkForCode = (code: string): string => {
  const origin = (typeof window !== "undefined" ? window.location.origin : APP_ORIGIN).replace(
    /\/$/,
    "",
  );
  return `${origin}/r?c=${code.toLowerCase()}`;
};
