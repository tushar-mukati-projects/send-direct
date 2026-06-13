"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { ScreenTopBar } from "@/components/layout/ScreenTopBar";
import { Button } from "@/components/ui/button";
import { FileRow } from "@/features/shared/FileRow";
import { fileCountLabel, fmtSize, sumSizes } from "@/lib/format";
import { useTransferStore } from "@/stores/transfer-store";

export const SendSelectView = () => {
  const files = useTransferStore((s) => s.files);
  const addFiles = useTransferStore((s) => s.addFiles);
  const removeFile = useTransferStore((s) => s.removeFile);
  const continueToShare = useTransferStore((s) => s.continueToShare);
  const goHome = useTransferStore((s) => s.goHome);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const total = sumSizes(files);
  const hasFiles = files.length > 0;

  const openPicker = () => inputRef.current?.click();

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!dragging) setDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files ?? []);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenTopBar
        backLabel="← BACK"
        onBack={goHome}
        right={<span className="text-accent text-[10px] tracking-[2px]">SEND · 01 / SELECT</span>}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Choose files to send"
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-[1.5px] border-dashed p-8 text-center transition-all"
        style={{
          borderColor: dragging ? "#3ef0a0" : "rgba(62,240,160,.3)",
          background: dragging ? "rgba(62,240,160,.1)" : "rgba(62,240,160,.03)",
        }}
      >
        <span className="border-accent/35 bg-accent/8 text-accent flex h-[46px] w-[46px] items-center justify-center rounded-full border text-xl">
          ↑
        </span>
        <span className="font-display text-bright text-[15px] font-semibold whitespace-nowrap">
          Drop files here
        </span>
        <span className="text-muted text-[11.5px]">
          or <span className="text-accent underline underline-offset-2">browse</span> — any size,
          any type
        </span>
      </div>

      {hasFiles && (
        <div className="flex flex-col gap-2">
          <div className="text-dim flex items-center justify-between text-[10px] tracking-[1.5px]">
            <span>QUEUE · {fileCountLabel(files.length)}</span>
            <span>{fmtSize(total)}</span>
          </div>
          {files.map((file) => (
            <FileRow
              key={file.id}
              name={file.name}
              size={file.size}
              onRemove={() => removeFile(file.id)}
            />
          ))}
        </div>
      )}

      <Button onClick={continueToShare} disabled={!hasFiles} className="p-3.5 text-[13px]">
        {hasFiles ? "GENERATE CODE & LINK  →" : "ADD FILES TO CONTINUE"}
      </Button>

      <input ref={inputRef} type="file" multiple onChange={handleInputChange} className="hidden" />
    </div>
  );
};
