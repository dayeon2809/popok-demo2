import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import PopokChatLauncher from "@/components/messages/PopokChatLauncher";
import PopokChatMessageTabs from "@/components/messages/PopokChatMessageTabs";
import { PopokChatDataProvider } from "@/components/messages/PopokChatDataProvider";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export default async function MyPopokLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: artist } = await getSupabaseServer()
    .from("artists" as any)
    .select("name")
    .eq("owner_id", user.id)
    .maybeSingle();
  const artistName = String((artist as any)?.name || "내 프로필");

  return (
    <PopokChatDataProvider>
      <PopokChatMessageTabs artistName={artistName} />
      {children}
      <PopokChatLauncher />
    </PopokChatDataProvider>
  );
}