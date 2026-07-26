import Link from "next/link";

export default function DiscoveryTabs({ active }: { active: "artists" | "companies" }) {
  return (
    <nav className="discovery-tabs" aria-label="탐색 대상">
      <Link href="/artists" aria-current={active === "artists" ? "page" : undefined}>
        <span aria-hidden="true" className="discovery-tab-dot" />아티스트
      </Link>
      <Link href="/companies" aria-current={active === "companies" ? "page" : undefined}>
        <span aria-hidden="true" className="discovery-tab-dot" />단체
      </Link>
    </nav>
  );
}
