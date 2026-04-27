import { requireClient } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  return (
    <div className="min-h-screen">
      <Sidebar role="CLIENT" userName={user.name} />
      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0 px-4 md:px-8 py-4 md:py-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
