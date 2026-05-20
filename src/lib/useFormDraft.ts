"use client";
import { useRef, useState, useCallback } from "react";

/**
 * Autosave drafts for plain uncontrolled <form> elements (defaultValue inputs —
 * the pattern most admin/modal forms use). Attach the returned `formRef` to the
 * form via the `ref` prop.
 *
 *   const { formRef, restored, clear, discard } = useFormDraft("nutrition-new");
 *   <form ref={formRef} action={...}>…</form>
 *   // on successful submit -> clear()
 *
 * Uses a CALLBACK ref so it also works for conditionally-rendered forms
 * (modals, inline editors) — wiring happens the moment the <form> attaches.
 *
 * - Saves named inputs/selects/textareas to localStorage (debounced 400ms).
 * - NEVER persists password or file inputs.
 * - Restores values when the form mounts; `restored` → show DraftBanner.
 */
export function useFormDraft(key: string, enabled = true) {
  const fullKey = `kovalfit-draft:${key}`;
  const [restored, setRestored] = useState(false);
  const timer = useRef<any>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const formRef = useCallback((form: HTMLFormElement | null) => {
    // Detach previous listeners
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (!form || !enabled) return;

    // ── Restore ──
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string>;
        let applied = false;
        for (const [name, value] of Object.entries(data)) {
          const el = form.elements.namedItem(name) as any;
          if (!el || typeof value !== "string") continue;
          const t = el.type;
          if (t === "password" || t === "file") continue;
          if (t === "checkbox") el.checked = value === "true";
          else el.value = value;
          applied = true;
        }
        if (applied) setRestored(true);
      }
    } catch { /* ignore */ }

    // ── Save on change (debounced) ──
    const handler = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const data: Record<string, string> = {};
        for (const el of Array.from(form.elements) as any[]) {
          if (!el.name) continue;
          const t = el.type;
          if (t === "password" || t === "file" || t === "submit" || t === "button") continue;
          if (t === "checkbox") data[el.name] = String(el.checked);
          else data[el.name] = el.value ?? "";
        }
        const hasContent = Object.values(data).some(v => v && v !== "false");
        try {
          if (hasContent) localStorage.setItem(fullKey, JSON.stringify(data));
          else localStorage.removeItem(fullKey);
        } catch { /* quota */ }
      }, 400);
    };
    form.addEventListener("input", handler);
    form.addEventListener("change", handler);
    cleanupRef.current = () => {
      form.removeEventListener("input", handler);
      form.removeEventListener("change", handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, fullKey]);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    try { localStorage.removeItem(fullKey); } catch {}
    setRestored(false);
  }, [fullKey]);

  const discard = useCallback(() => {
    clear();
  }, [clear]);

  return { formRef, restored, clear, discard };
}
