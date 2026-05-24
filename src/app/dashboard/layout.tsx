import { requireClient } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  // Show a red dot on the menu button if there's an unpaid invoice.
  const pendingCount = await prisma.payment.count({
    where: { clientId: user.id, status: { in: ["pending", "overdue"] } },
  }).catch(() => 0);

  return (
    <div className="min-h-screen">
      <Sidebar role="CLIENT" userName={user.name} hasPendingPayment={pendingCount > 0} />
      <main className="md:ml-64 pt-16 md:pt-0 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-0 px-4 md:px-8 py-4 md:py-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
