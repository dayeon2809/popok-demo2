import type { ReactNode } from "react";
export default function DiscoveryGrid({ children, ariaLabel }: { children: ReactNode; ariaLabel: string }) {
  return <div className="discovery-grid" aria-label={ariaLabel}>{children}</div>;
}
