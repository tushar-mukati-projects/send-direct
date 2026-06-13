export const TerminalBackdrop = () => (
  <>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)",
        backgroundSize: "34px 34px",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -top-[180px] left-1/2 h-[420px] w-[680px] -translate-x-1/2"
      style={{
        background: "radial-gradient(closest-side,rgba(62,240,160,.10),transparent 75%)",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: "radial-gradient(ellipse at 50% 0%,transparent 55%,rgba(0,0,0,.55) 100%)",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
      style={{
        backgroundImage: "repeating-linear-gradient(rgba(0,0,0,0) 0 2px,rgba(0,0,0,.16) 2px 3px)",
      }}
    />
    <div
      aria-hidden
      className="animate-sd-sweep pointer-events-none absolute inset-x-0 top-0 h-[34vh]"
      style={{
        background: "linear-gradient(180deg,transparent,rgba(62,240,160,.045) 60%,transparent)",
      }}
    />
  </>
);
