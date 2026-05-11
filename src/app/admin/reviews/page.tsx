import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ReviewsAdmin } from "./ReviewsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews: any[] = await (prisma as any).review.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
  });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Відгуки"
        subtitle={`${reviews.length} всього · середня оцінка ${avg ? avg.toFixed(1) : "—"} ★`}
      />
      <ReviewsAdmin initial={reviews} />
    </div>
  );
}
