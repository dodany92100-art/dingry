import { cn } from "@/lib/utils";
import { DINGRY_LOGO_URL } from "@/lib/dingry-brand";

type DingryLogoProps = {
  className?: string;
  animate?: boolean;
};

export function DingryLogo({ className, animate = true }: DingryLogoProps) {
  return (
    <img
      src={DINGRY_LOGO_URL}
      alt="DINGRY Paris"
      className={cn("h-7 w-auto max-md:max-h-7 md:h-11", animate && "dingry-logo-flip", className)}
      decoding="async"
    />
  );
}
