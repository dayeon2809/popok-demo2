import type { ReactNode } from "react";
export default function DiscoveryCard({ children }: { children: ReactNode }) {
  return <article className="discovery-card">{children}</article>;
}
