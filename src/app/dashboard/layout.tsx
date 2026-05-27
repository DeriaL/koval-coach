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
      <main
        className="md:ml-64 px-4 md:px-8 max-w-6xl mx-auto pt-[calc(3.5rem+env(safe-area-inset-top)+1.25rem)] md:pt-8 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-8"
      >
        {children}
      </main>
    </div>
  );
}
