import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-mono font-semibold tracking-[1px] transition-all disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-[#04140d] hover:brightness-110 disabled:bg-white/5 disabled:text-dim disabled:hover:brightness-100",
        accentSoft: "border border-accent/30 bg-accent/12 text-accent hover:bg-accent/20",
        ghost: "border border-white/10 text-subtle hover:border-white/28 hover:text-ink",
        danger: "border border-white/10 text-subtle hover:border-danger hover:text-danger",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, type = "button", ...props }: ButtonProps) => (
  <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />
);
