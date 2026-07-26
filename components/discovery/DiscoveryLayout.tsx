import type { ReactNode } from "react";
import DiscoveryTabs from "./DiscoveryTabs";

export default function DiscoveryLayout({ active, eyebrow, title, description, children }: {
  active: "artists" | "companies"; eyebrow: string; title: string; description: string; children: ReactNode;
}) {
  return (
    <div className="discovery-page">
      <DiscoveryTabs active={active} />
      <header className="discovery-hero">
        <span className="mono">{eyebrow}</span><h1>{title}</h1><p>{description}</p>
      </header>
      {children}
    </div>
  );
}
