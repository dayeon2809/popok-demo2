import { getSupabaseServer } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClientCard from "./client-card";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CardResultPage({ params }: Props) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();

  const supabase = getSupabaseServer();
  let record = null;

  try {
    const numericId = Number(decodedId);
    let query = supabase.from("submissions").select("*");

    if (!isNaN(numericId)) {
      query = query.eq("id", numericId);
    } else {
      // Allow querying by name (username fallback)
      query = query.eq("name", decodedId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[CardResultPage] Supabase error:", error);
    }
    
    record = data;
  } catch (err) {
    console.error("[CardResultPage] Query error:", err);
  }

  if (!record) {
    notFound();
  }

  return (
    <main style={{ background: "var(--bg-warm)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(245,241,232,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          maxWidth: "1120px", margin: "0 auto", padding: "0 32px", height: "56px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
              POPOK
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            </div>
          </Link>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/artists" style={{ textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Artists
            </Link>
            <Link href="/onboarding" style={{ textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Create card
            </Link>
          </div>
        </div>
      </header>

      {/* Render interactive business card detail */}
      <ClientCard record={record} />
    </main>
  );
}
