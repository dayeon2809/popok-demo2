import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import MessageListClient from "./MessageListClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/my-popok/messages");
  return <MessageListClient />;
}
