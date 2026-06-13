"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

const ReceiveWithCode = () => {
  const code = useSearchParams().get("c") ?? "";
  return <AppShell prefillCode={code} />;
};

const ReceivePage = () => (
  <Suspense fallback={<AppShell />}>
    <ReceiveWithCode />
  </Suspense>
);

export default ReceivePage;
