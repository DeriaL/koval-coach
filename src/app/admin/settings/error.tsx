"use client";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card p-6 max-w-xl">
      <div className="text-danger font-bold mb-2">Помилка на сторінці налаштувань</div>
      <pre className="text-xs text-muted bg-surface p-3 rounded-lg overflow-auto mb-4 whitespace-pre-wrap">
        {error.message}
        {"\n"}
        {error.digest}
      </pre>
      <button onClick={reset} className="btn btn-primary">Спробувати ще раз</button>
    </div>
  );
}
