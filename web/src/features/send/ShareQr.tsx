import QRCode from "react-qr-code";
import { linkForCode } from "@/lib/webrtc/constants";

interface ShareQrProps {
  code: string;
}

export const ShareQr = ({ code }: ShareQrProps) => (
  <div
    aria-hidden
    className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white p-2"
  >
    <QRCode
      value={linkForCode(code)}
      size={256}
      bgColor="#ffffff"
      fgColor="#06080a"
      style={{ height: "100%", width: "100%" }}
    />
  </div>
);
