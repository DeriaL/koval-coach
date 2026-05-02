"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "З чого почнеться співпраця?",
    a: "Спершу обговоримо твої цілі, рівень підготовки, обмеження. Я підберу формат: онлайн або офлайн. Після цього ти отримаєш доступ до особистого кабінету з програмою тренувань і харчуванням під ключ.",
  },
  {
    q: "Чим онлайн-формат відрізняється від офлайн?",
    a: "Послуги однакові — програма, харчування, добавки, контроль, чат, аналітика. Різниця лише в тому, де ти тренуєшся: вдома/у своєму залі сам або зі мною в моєму залі особисто. Я веду тебе у кабінеті в обох випадках.",
  },
  {
    q: "Як часто оновлюється програма?",
    a: "Програма коригується за твоїм прогресом — мінімум раз на місяць або частіше, якщо бачу що щось не працює як треба. Ти не лишишся з планом, який вичерпав себе.",
  },
  {
    q: "Що з оплатою?",
    a: "Оплата пакетами по 10 тренувань. Кожні 10 завершених сесій = одна «зупинка» у твоєму прогресі. Без прихованих платежів і автосписань.",
  },
  {
    q: "Чи потрібне якесь обладнання вдома?",
    a: "Залежить від цілей і умов. Якщо тренуєшся вдома — підлаштую програму під те, що в тебе є. Можу запропонувати мінімальний набір, який окупиться.",
  },
  {
    q: "А якщо я ніколи не тренувався?",
    a: "Це навіть простіше — ми не маємо що ламати. Почнемо з основ, поставимо техніку, і за 2-3 місяці буде помітний результат.",
  },
  {
    q: "Скільки часу до видимого результату?",
    a: "Перші зміни самопочуття — за 2 тижні. Видимі зміни тіла — 6-8 тижнів за умови чесної роботи з планом і харчуванням.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <button
            key={i}
            onClick={() => setOpen(isOpen ? null : i)}
            className={`card w-full text-left p-5 transition-all duration-300 group ${isOpen ? "border-accent/50 shadow-glow" : "hover:border-accent/40"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-base md:text-lg">{it.q}</div>
              <ChevronDown className={`w-5 h-5 shrink-0 text-accent transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </div>
            <div
              className="grid transition-all duration-500 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="text-muted text-sm md:text-base mt-3 leading-relaxed">{it.a}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
