"use client";
import { ChatThread } from "@/components/ChatThread";

export function ChatTab({ clientId, initial }: { clientId: string; initial: any[] }) {
  return <ChatThread clientId={clientId} meRole="TRAINER" initial={initial} />;
}
