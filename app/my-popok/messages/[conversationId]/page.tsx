import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ConversationClient from "./ConversationClient";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/my-popok/messages/${conversationId}`);
  return <ConversationClient conversationId={conversationId} />;
}
