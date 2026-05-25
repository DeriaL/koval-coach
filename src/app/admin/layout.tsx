import { requireTrainer } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTrainer();
  return (
    <div className="min-h-screen">
      <Sidebar role="TRAINER" userName={user.name} />
      <main className="md:ml-64 pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-8 px-4 md:px-8 py-4 md:py-8">
        {children}
      </main>
    </div>
  );
}
