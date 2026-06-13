"use client";

import { useEffect, useRef, useState } from "react";
import { codeFromText } from "@/lib/code";

interface QrScannerOverlayProps {
  onResult: (code: string) => void;
  onClose: () => void;
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

type BarcodeDetectorCtor = new (options?: { formats: string[] }) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

export const QrScannerOverlay = ({ onResult, onClose }: QrScannerOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const Detector = window.BarcodeDetector;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const stop = () => {
      stopped = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };

    const start = async () => {
      if (!Detector) {
        setError("This browser can’t scan QR codes. Paste the link instead.");
        return;
      }
      const detector = new Detector({ formats: ["qr_code"] });
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        timer = setInterval(async () => {
          if (stopped || !video) return;
          try {
            const codes = await detector.detect(video);
            for (const code of codes) {
              const parsed = codeFromText(code.rawValue);
              if (parsed) {
                stop();
                onResult(parsed);
                return;
              }
            }
          } catch {
            return;
          }
        }, 300);
      } catch {
        setError("Camera access was blocked. Paste the link instead.");
      }
    };

    void start();
    return stop;
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <div
        className="flex w-full max-w-[320px] flex-col gap-3 rounded-[14px] border border-white/10 p-4"
        style={{ background: "linear-gradient(180deg,rgba(16,21,27,.96),rgba(9,12,16,.96))" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-accent text-[11px] tracking-[1.5px]">SCAN QR</span>
          <button
            type="button"
            onClick={onClose}
            className="text-dim hover:text-subtle-2 cursor-pointer p-1 text-base leading-none transition-colors"
          >
            ×
          </button>
        </div>
        {error ? (
          <p className="text-muted py-6 text-center text-[12px] leading-[1.6]">{error}</p>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-square w-full rounded-[10px] border border-white/10 object-cover"
          />
        )}
        <p className="text-dim text-center text-[10.5px]">point at the sender’s QR code</p>
      </div>
    </div>
  );
};
