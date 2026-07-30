"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MessageListItem } from "@/lib/messages";

type PopokChatData = {
  items: MessageListItem[];
  loading: boolean;
  unreadCount: number;
  reload: () => Promise<void>;
};

const PopokChatDataContext = createContext<PopokChatData | null>(null);

export function PopokChatDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const reload = useCallback((): Promise<void> => {
    if (inFlightRef.current) return inFlightRef.current;
    const request = (async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/messages", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setItems(data.items || []);
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo(() => ({
    items,
    loading,
    unreadCount: items.filter((item) => item.unread).length,
    reload,
  }), [items, loading, reload]);

  return <PopokChatDataContext.Provider value={value}>{children}</PopokChatDataContext.Provider>;
}

export function usePopokChatData(): PopokChatData {
  const value = useContext(PopokChatDataContext);
  if (!value) throw new Error("usePopokChatData must be used inside PopokChatDataProvider");
  return value;
}
export function useOptionalPopokChatData(): PopokChatData | null {
  return useContext(PopokChatDataContext);
}