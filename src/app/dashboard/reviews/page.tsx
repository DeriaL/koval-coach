import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { Star, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const u = await requireClient();
  const myReviews: any[] = await (prisma as any).review.findMany({
    where: { clientId: u.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Відгуки"
        subtitle="Поділись враженнями від тренувань"
      />

      <ReviewForm canEdit={true} />

      {myReviews.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Мої відгуки
          </div>
          <div className="space-y-3">
            {myReviews.map(r => (
              <div key={r.id} className="card p-4 md:p-5">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= r.rating ? "fill-current" : "text-muted"}`} />
                    ))}
                  </div>
                  <span className={`chip text-[10px] py-0 px-2 ${r.approved ? "text-success border-success/40" : "text-accent2 border-accent2/40"}`}>
                    {r.approved
                      ? <><CheckCircle2 className="w-3 h-3" /> опубліковано</>
                      : <><Clock className="w-3 h-3" /> на перевірці</>}
                  </span>
                </div>
                {r.text && (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{r.text}</div>
                )}
                <div className="text-[10px] text-muted mt-2">
                  {new Date(r.createdAt).toLocaleDateString("uk-UA", { dateStyle: "long" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
