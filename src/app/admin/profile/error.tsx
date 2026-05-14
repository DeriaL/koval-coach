"use client";
import { useEffect } from "react";

export default function ProfileError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/admin/profile error]", error);
  }, [error]);
  return (
    <div className="card p-6 max-w-xl">
      <div className="text-danger font-bold mb-2">Помилка на сторінці профілю</div>
      <pre className="text-xs text-muted bg-surface p-3 rounded-lg overflow-auto mb-4 whitespace-pre-wrap break-words">
        {error.message}
        {error.digest ? `\n\nID: ${error.digest}` : ""}
      </pre>
      <button onClick={reset} className="btn btn-primary">Спробувати ще раз</button>
    </div>
  );
}
