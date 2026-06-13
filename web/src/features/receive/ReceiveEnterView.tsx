"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScreenTopBar } from "@/components/layout/ScreenTopBar";
import { Button } from "@/components/ui/button";
import { CodeCells } from "@/features/receive/CodeCells";
import { QrScannerOverlay } from "@/features/receive/QrScannerOverlay";
import { codeFromText } from "@/lib/code";
import { useTransferStore } from "@/stores/transfer-store";

export const ReceiveEnterView = () => {
  const codeInput = useTransferStore((s) => s.codeInput);
  const setCodeInput = useTransferStore((s) => s.setCodeInput);
  const submitCode = useTransferStore((s) => s.submitCode);
  const goHome = useTransferStore((s) => s.goHome);

  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const complete = codeInput.length >= 6;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitCode();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const fromLink = raw.length > 6 ? codeFromText(raw) : null;
    setCodeInput(fromLink ?? raw);
  };

  const handleScanResult = useCallback(
    (code: string) => {
      setCodeInput(code);
      setScanning(false);
    },
    [setCodeInput],
  );

  const closeScanner = useCallback(() => setScanning(false), []);

  const pasteLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const code = codeFromText(text);
      if (code) {
        setCodeInput(code);
        return;
      }
      toast.error("no transfer code found on the clipboard");
    } catch {
      toast.error("couldn’t read the clipboard");
    }
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenTopBar
        backLabel="← BACK"
        onBack={goHome}
        right={<span className="text-subtle text-[10px] tracking-[2px]">RECEIVE · ENTER CODE</span>}
      />

      <div className="flex flex-col gap-2 text-center">
        <span className="text-subtle-2 mx-auto flex h-[46px] w-[46px] items-center justify-center rounded-full border border-white/14 bg-white/4 text-xl">
          ↓
        </span>
        <h2 className="font-display text-bright mt-1 text-lg font-semibold">
          Enter the transfer code
        </h2>
        <p className="text-muted text-[11.5px]">6‑character code from the sender</p>
      </div>

      <div className="relative cursor-text" onClick={() => inputRef.current?.focus()}>
        <CodeCells value={codeInput} />
        <input
          ref={inputRef}
          value={codeInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="transfer code"
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="absolute inset-0 h-full w-full cursor-text border-none bg-transparent text-transparent caret-transparent outline-none"
        />
      </div>

      <div className="flex items-center gap-2.5">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-dim text-[9.5px] tracking-[2px]">OR</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={pasteLink}
          className="text-subtle hover:text-subtle-2 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/2 p-[11px] text-[10.5px] tracking-[0.5px] transition-colors hover:border-white/25"
        >
          🔗 paste link
        </button>
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="text-subtle hover:text-subtle-2 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/2 p-[11px] text-[10.5px] tracking-[0.5px] transition-colors hover:border-white/25"
        >
          ☷ scan QR
        </button>
      </div>

      <Button onClick={submitCode} disabled={!complete} className="p-3.5 text-[13px]">
        CONNECT →
      </Button>

      {scanning && <QrScannerOverlay onResult={handleScanResult} onClose={closeScanner} />}
    </div>
  );
};
