"use client";
import { AnalysesPanel } from "@/components/AnalysesPanel";

export function AnalysesTab({ clientId, items }: { clientId: string; items: any[] }) {
  return <AnalysesPanel role="TRAINER" clientId={clientId} items={items} />;
}
