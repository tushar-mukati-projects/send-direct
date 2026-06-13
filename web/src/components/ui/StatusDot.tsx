import { cn } from "@/lib/utils";

interface StatusDotProps {
  amber?: boolean;
  className?: string;
}

export const StatusDot = ({ amber, className }: StatusDotProps) => (
  <span
    className={cn(
      "rounded-full",
      amber ? "animate-sd-pulse-amber bg-amber" : "animate-sd-pulse bg-accent",
      className,
    )}
  />
);
