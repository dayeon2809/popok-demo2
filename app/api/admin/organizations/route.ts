// Compatibility shim — the real logic lives at /api/admin/organization-applications
// now. Kept in place (rather than deleted) in case another caller still
// points at this older path. Route segment config (`dynamic`) is declared
// directly here since Next's static analysis for it doesn't reliably follow
// a re-export.
export { GET } from "../organization-applications/route";

export const dynamic = "force-dynamic";
