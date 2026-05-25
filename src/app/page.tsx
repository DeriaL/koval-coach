import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/Reveal";
import { StickyNav } from "@/components/StickyNav";
import { CardSpot } from "@/components/CardSpot";
import { Magnetic } from "@/components/Magnetic";
import { CountUp } from "@/components/CountUp";
import { FloatingContact } from "@/components/FloatingContact";
import {
  ArrowRight, Play, Check, Star, Phone, Mail, Send, Instagram, MapPin,
  Apple, Pill, Camera, Flame, Trophy, MessageCircle, Wallet, BarChart3,
  Dumbbell, Layers, Sparkles, ShieldCheck,
} from "lucide-react";

export default async function Home() {
  // === ЛОГІКА БЕЗ ЗМІН ===
  const session = await getSession();
  if (session?.user) {
    if ((session.user as any).role === "TRAINER") redirect("/admin");
    redirect("/dashboard");
  }

  const cfg = await (prisma as any).siteConfig.findUnique({ where: { id: "main" } }).catch(() => null);

  const dbReviews: any[] = await (prisma as any).review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  }).catch(() => []);
  // =======================

  const city = cfg?.city || "Львів";
  // «Залишити заявку» / «Записатись» ведуть прямо в Telegram тренера
  const tg = "https://t.me/dmytro_kovalchuk_coach";
  const priceOnline = cfg?.priceOnline || "5 000";
  const priceOffline = cfg?.priceOffline || "5 000";
  const priceNote = cfg?.priceNote || "пакет 10 тренувань";

  const reviews = (dbReviews.length > 0
    ? dbReviews.map((r) => ({ name: r.authorName, meta: "клієнт", text: r.text || "Дуже задоволений співпрацею!", rating: r.rating }))
    : FALLBACK_REVIEWS);

  const reviewWord = reviews.length === 1 ? "відгук" : reviews.length < 5 ? "відгуки" : "відгуків";

  // Nav links — only include sections that will actually render
  const navItems = [
    cfg?.aboutMe?.trim() ? { href: "#about", label: "Про мене" } : null,
    { href: "#how", label: "Як це працює" },
    { href: "#features", label: "Можливості" },
    { href: "#pricing", label: "Тарифи" },
    { href: "#reviews", label: "Відгуки" },
    (cfg?.email || cfg?.telegram || cfg?.instagram || cfg?.city) ? { href: "#contacts", label: "Контакти" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  const smallFeatures = [
    { t: "Харчування", d: "Персональний раціон під твою ціль, з моїми нотатками.", Icon: Apple, span: "col-span-1 lg:col-span-2" },
    { t: "Добавки", d: "Що, коли і скільки. Без плутанини.", Icon: Pill, span: "col-span-1 lg:col-span-2" },
    { t: "Фото-прогрес", d: "Таймлайн до/після з повзунком порівняння.", Icon: Camera, span: "col-span-2 lg:col-span-2" },
    { t: "Щоденний звіт", d: "Сон, енергія, настрій — я бачу все.", Icon: Flame, span: "col-span-1 lg:col-span-2" },
    { t: "Нагадування", d: "Вчасні нагадування про тренування й заміри.", Icon: ShieldCheck, span: "col-span-1 lg:col-span-2" },
    { t: "Оплати", d: "Історія платежів і статус підписки.", Icon: Wallet, span: "col-span-2 lg:col-span-2" },
  ];

  const steps = [
    { i: 1, t: "Знайомство", d: "Обговорюємо твої цілі, досвід та обмеження. Підбираю оптимальний формат роботи саме під тебе!", Icon: MessageCircle },
    { i: 2, t: "План під ключ", d: "Створюю персональну програму тренувань, раціон харчування та схему добавок. Надаю доступ до особистого кабінету.", Icon: Layers },
    { i: 3, t: "Прогрес щодня", d: "Аналізую твої звіти, тренування та динаміку. За потреби — вчасно коригую план для максимального результату!", Icon: BarChart3 },
  ];

  const onlinePerks = [
    "Персональна програма тренувань та харчування",
    "Моніторинг аналізів",
    "Підбір добавок",
    "Щоденний звіт самопочуття",
    "Зворотний звʼязок і звіти",
    "Фото-прогрес",
  ];
  const offlinePerks = [
    "Персональний план харчування",
    "Особистий кабінет 24/7",
    "Аналітика прогресу",
    "Заплановані тренування",
    "Трекер особистих рекордів у залі",
  ];

  return (
    <main className="relative overflow-x-hidden">
      <StickyNav items={navItems} tgHref={tg} />

      {/* ============ HERO ============ */}
      <section className="relative pt-28 lg:pt-36 pb-20 lg:pb-28 overflow-hidden noise">
        <div className="mesh" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-grid bg-[length:40px_40px] opacity-50" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="chip text-[11px] tracking-wide">
                📍 ЛЬВІВ (ОФЛАЙН) • 🌐 ОНЛАЙН ПО УКРАЇНІ • НАБІР ВІДКРИТИЙ
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="font-display mt-6 font-black tracking-tight leading-[1] text-[clamp(1.9rem,7.5vw,5.4rem)] [text-wrap:balance]">
                <span className="block">Твій шлях.</span>
                <span className="block text-gradient">Твої результати.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg md:text-xl font-semibold text-text leading-snug">
                Персональний супровід для тих, хто цінує якість результату.
              </p>
              <p className="mt-3 max-w-xl text-base md:text-lg text-muted leading-relaxed">
                Індивідуальний план харчування та тренувань, моніторинг аналізів та корекція,
                контроль прогресу з увагою до деталей, системністю та високим рівнем комунікації!
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Magnetic>
                  <Link href="/login" className="btn btn-primary px-6 py-3 group">
                    Почати <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Magnetic>
                <a href="#how" className="btn px-6 py-3"><Play className="w-4 h-4" /> Як це працює</a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <dl className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
                {[
                  { k: "Клієнтів", v: <CountUp to={100} suffix="+" /> },
                  { k: "Підтримка", v: "24/7" },
                  { k: "Рейтинг", v: <>5<span className="text-accent">★</span></> },
                ].map((s) => (
                  <div key={s.k} className="card p-4 sm:p-5 text-center">
                    <dd className="font-display text-2xl sm:text-4xl font-black text-gradient">{s.v}</dd>
                    <dt className="mt-1 text-[10px] sm:text-xs uppercase tracking-widest text-muted">{s.k}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Trainer card */}
          <Reveal delay={200} className="lg:col-span-5">
            <div className="relative max-w-md mx-auto lg:max-w-none">
              <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-accent/30 to-accent2/20 blur-2xl" aria-hidden />
              <div className="card ring-shine rounded-[32px] p-3 sm:p-4 ring-glow">
                <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-surface">
                  <Image
                    src="/trainer.png"
                    alt="Дмитро Ковальчук — персональний тренер"
                    fill priority sizes="(min-width:1024px) 40vw, 100vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 chip bg-card/80 backdrop-blur">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" /> На звʼязку
                  </span>
                  <span className="absolute right-4 top-4 chip bg-card/80 backdrop-blur">
                    <Sparkles className="w-3 h-3 text-accent" /> 8+ років досвіду
                  </span>
                  <div className="absolute left-4 right-4 bottom-4 card p-3 flex items-center gap-3 bg-card/90 backdrop-blur">
                    <div className="h-10 w-10 rounded-xl accent-shine grid place-items-center text-white font-bold shrink-0">Д</div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">Сьогодні: Тренування ніг</div>
                      <div className="text-xs text-muted truncate">4 вправи • 75 хв • інтенсивність 8/10</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ ABOUT (лише якщо заповнено) ============ */}
      {cfg?.aboutMe?.trim() && (
        <section id="about" className="relative py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <Reveal className="lg:col-span-5">
              <span className="chip"><Sparkles className="w-3 h-3 text-accent" /> Про мене</span>
              <h2 className="font-display mt-5 text-3xl sm:text-5xl font-black tracking-tight">
                Хто я і як працюю
              </h2>
              <p className="mt-4 text-muted">Без магії — лише дані, техніка й послідовність.</p>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-7">
              <div className="card p-6 lg:p-8">
                <p className="text-text/90 leading-relaxed whitespace-pre-wrap break-words">{cfg.aboutMe}</p>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ 3 КРОКИ ============ */}
      <section id="how" className="relative py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <span className="chip"><Layers className="w-3 h-3 text-accent" /> 3 кроки</span>
            <h2 className="font-display mt-5 text-3xl sm:text-5xl font-black tracking-tight">
              Від першого повідомлення<br className="hidden sm:block" /> до першого результату.
            </h2>
            <p className="text-muted mt-3">Без зайвого. Без води. Тільки те, що приведе до цілі.</p>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-4 md:gap-5 relative">
            <div className="hidden md:block absolute left-[8%] right-[8%] top-[58px] h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />
            {steps.map((s, idx) => (
              <Reveal key={s.i} delay={idx * 100}>
                <CardSpot className="p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs tracking-widest text-muted">КРОК 0{s.i}</span>
                    <span className="h-10 w-10 rounded-2xl border border-border grid place-items-center text-accent">
                      <s.Icon className="w-5 h-5" />
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{s.d}</p>
                </CardSpot>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ МОЖЛИВОСТІ — BENTO ============ */}
      <section id="features" className="relative py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <Reveal>
            <span className="chip"><Sparkles className="w-3 h-3 text-accent" /> Можливості</span>
            <h2 className="font-display mt-5 text-3xl sm:text-5xl font-black tracking-tight max-w-3xl">
              Вся індивідуальна система<br className="hidden sm:block" /> роботи в одному кабінеті.
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-5 lg:auto-rows-[180px]">
            {/* HERO TILE — тренування */}
            <Reveal className="col-span-2 lg:col-span-3 lg:row-span-2">
              <CardSpot className="p-6 lg:p-7 relative">
                <div className="absolute inset-0 bg-grid bg-[length:32px_32px] opacity-30" aria-hidden />
                <div className="relative flex h-full flex-col">
                  <span className="chip self-start"><Dumbbell className="w-3 h-3 text-accent" /> Тренування</span>
                  <h3 className="font-display text-2xl lg:text-3xl font-black tracking-tight mt-4">
                    Всі тренування — на одному екрані.
                  </h3>
                  <p className="text-muted text-sm mt-2 max-w-md">
                    План на тиждень, техніка виконання вправ і миттєвий зворотний зв&apos;язок від мене!
                  </p>
                  <div className="mt-auto grid grid-cols-3 gap-2 pt-6">
                    {[
                      { d: "Пн", n: "Спина", w: "100%", on: false },
                      { d: "Ср · сьогодні", n: "Грудні", w: "66%", on: true },
                      { d: "Пт", n: "Ноги", w: "0%", on: false },
                    ].map((c) => (
                      <div key={c.d} className={`rounded-xl border p-3 ${c.on ? "border-accent/40 bg-accent/10" : "border-border bg-bg/40"}`}>
                        <div className={`text-[10px] uppercase tracking-widest ${c.on ? "text-accent" : "text-muted"}`}>{c.d}</div>
                        <div className="text-sm font-semibold mt-1">{c.n}</div>
                        <div className="h-1 mt-2 rounded-full bg-border overflow-hidden">
                          <div className="h-full accent-shine" style={{ width: c.w }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardSpot>
            </Reveal>

            {/* HERO TILE — аналітика */}
            <Reveal delay={60} className="col-span-2 lg:col-span-3 lg:row-span-2">
              <CardSpot className="p-6 relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="chip"><BarChart3 className="w-3 h-3 text-accent" /> Аналітика</span>
                    <h3 className="font-display text-2xl font-black tracking-tight mt-4">Прогрес у цифрах,<br />а не у відчуттях!</h3>
                    <p className="text-muted text-sm mt-2 max-w-sm">Вага, заміри, % жиру й динаміка змін. Усе, що змінюється — помітно одразу!</p>
                  </div>
                  <span className="h-10 w-10 rounded-2xl border border-border grid place-items-center text-accent shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </span>
                </div>
                <svg viewBox="0 0 320 110" className="mt-5 w-full" aria-hidden>
                  <defs>
                    <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity=".5" />
                      <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,90 C40,80 60,60 100,55 C140,50 160,75 200,60 C240,45 270,30 320,15 L320,110 L0,110 Z" fill="url(#spark)" />
                  <path d="M0,90 C40,80 60,60 100,55 C140,50 160,75 200,60 C240,45 270,30 320,15" fill="none" stroke="rgb(99,102,241)" strokeWidth="2.2" />
                </svg>
              </CardSpot>
            </Reveal>

            {/* SMALL TILES */}
            {smallFeatures.map((f, i) => (
              <Reveal key={f.t} delay={i * 40} className={f.span}>
                <CardSpot className="p-5 min-h-[150px]">
                  <span className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 grid place-items-center text-accent">
                    <f.Icon className="w-4 h-4" />
                  </span>
                  <h3 className="mt-3 font-semibold">{f.t}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{f.d}</p>
                </CardSpot>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ТАРИФИ ============ */}
      <section id="pricing" className="relative py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <span className="chip"><ShieldCheck className="w-3 h-3 text-accent" /> Тарифи</span>
            <h2 className="font-display mt-5 text-3xl sm:text-5xl font-black tracking-tight">
              Один формат — для тренувань будь-де.<br className="hidden sm:block" /> Інший — для спільної роботи в залі!
            </h2>
            <p className="text-muted mt-4 max-w-xl">Обери формат, що підходить твоєму ритму життя.</p>
          </Reveal>

          <div className="mt-12 grid lg:grid-cols-2 gap-6">
            {/* ОНЛАЙН — featured */}
            <Reveal className="relative">
              <div className="absolute -inset-2 rounded-[36px] bg-gradient-to-br from-accent/40 via-accent2/30 to-transparent blur-2xl -z-10" aria-hidden />
              <article className="card ring-shine rounded-[32px] p-8 lg:p-10 ring-glow h-full">
                <div className="flex items-center justify-between">
                  <span className="chip border-accent/40 text-accent">⭐ Найпопулярніший</span>
                  <span className="text-xs uppercase tracking-widest text-muted">дистанційно</span>
                </div>
                <h3 className="font-display mt-6 text-3xl font-black tracking-tight">Онлайн-супровід</h3>
                <p className="text-muted text-sm mt-1">тренуєшся сам, я веду тебе в кабінеті</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl sm:text-6xl font-black tracking-tight text-gradient">{priceOnline}</span>
                  <span className="text-muted text-sm">грн / міс</span>
                </div>
                <Magnetic className="block mt-7 w-full">
                  <a href={tg} target="_blank" rel="noreferrer" className="btn btn-primary w-full justify-center">
                    Залишити заявку <ArrowRight className="w-4 h-4" />
                  </a>
                </Magnetic>
                <ul className="mt-8 space-y-3 text-sm">
                  {onlinePerks.map((x) => (
                    <li key={x} className="flex items-start gap-3"><Check className="w-4 h-4 mt-0.5 text-accent shrink-0" /> {x}</li>
                  ))}
                </ul>
              </article>
            </Reveal>

            {/* ОФЛАЙН */}
            <Reveal delay={120}>
              <article className="card rounded-[32px] p-8 lg:p-10 h-full">
                <div className="flex items-center justify-between">
                  <span className="chip">{city} · 1-на-1</span>
                  <span className="text-xs uppercase tracking-widest text-muted">у залі</span>
                </div>
                <h3 className="font-display mt-6 text-3xl font-black tracking-tight">Офлайн у залі</h3>
                <p className="text-muted text-sm mt-1">тренуєшся зі мною особисто</p>
                <div className="mt-6 flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-5xl sm:text-6xl font-black tracking-tight">{priceOffline}</span>
                  <span className="text-muted text-sm">грн / {priceNote}</span>
                </div>
                <a href={tg} target="_blank" rel="noreferrer" className="btn w-full justify-center mt-7">
                  Записатись <ArrowRight className="w-4 h-4" />
                </a>
                <ul className="mt-8 space-y-3 text-sm">
                  {offlinePerks.map((x) => (
                    <li key={x} className="flex items-start gap-3"><Check className="w-4 h-4 mt-0.5 text-accent shrink-0" /> {x}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <p className="text-center mt-8 text-sm text-muted">
              Оплата пакетами по 10 тренувань. Без прихованих платежів.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ ВІДГУКИ — біжучі стрічки ============ */}
      <section id="reviews" className="relative py-20 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <Reveal>
            <span className="chip"><Star className="w-3 h-3 text-accent" /> Відгуки</span>
            <h2 className="font-display mt-5 text-3xl sm:text-5xl font-black tracking-tight">
              Що кажуть мої клієнти.
            </h2>
          </Reveal>
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5 text-yellow-400">
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} className="w-5 h-5 fill-current" />)}
            </div>
            <div className="text-sm text-muted"><b className="text-text">5.0</b> · {reviews.length} {reviewWord}</div>
          </div>
        </div>

        {[reviews.slice(0, Math.ceil(reviews.length / 2)), reviews.slice(Math.ceil(reviews.length / 2))].map((row, ri) => (
          row.length === 0 ? null : (
            <div key={ri} className={`marquee ${ri === 0 ? "mb-4" : ""}`}>
              <div className={`marquee-track ${ri === 1 ? "rev" : ""}`}>
                {[...row, ...row].map((r, i) => (
                  <div key={`${ri}-${i}`} className="card p-6 w-[320px] sm:w-[380px] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full accent-shine grid place-items-center text-white text-sm font-bold shrink-0">
                        {r.name?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{r.name}</div>
                        <div className="text-xs text-muted">{r.meta}</div>
                      </div>
                      <div className="ml-auto flex gap-0.5 text-yellow-400">
                        {Array.from({ length: r.rating ?? 5 }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap break-words line-clamp-5">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </section>

      {/* ============ CTA ============ */}
      <section className="relative py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          <Reveal className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-accent/30 to-accent2/20 blur-3xl" aria-hidden />
            <div className="card ring-shine rounded-[36px] p-10 lg:p-16 text-center ring-glow overflow-hidden relative">
              <div className="absolute inset-0 bg-grid bg-[length:32px_32px] opacity-30" aria-hidden />
              <div className="relative">
                <span className="chip mx-auto"><Flame className="w-3 h-3 text-accent" /> Початок ближче, ніж здається</span>
                <h2 className="font-display mt-6 text-3xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                  Час почати!<br /><span className="text-gradient">Решту зробимо крок за кроком.</span>
                </h2>
                <p className="text-muted mt-6 max-w-xl mx-auto">
                  Напиши мені — і вже завтра в тебе буде особистий план та доступ до кабінету.
                </p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <Magnetic>
                    <Link href="/login" className="btn btn-primary px-6 py-3">
                      Увійти в кабінет <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Magnetic>
                  {navItems.some((n) => n.href === "#contacts") && (
                    <a href="#contacts" className="btn px-6 py-3">Контакти</a>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ КОНТАКТИ (лише заповнені поля) ============ */}
      {(cfg?.email || cfg?.telegram || cfg?.instagram || cfg?.city) && (
        <section id="contacts" className="relative py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <Reveal className="lg:col-span-5">
              <span className="chip"><Phone className="w-3 h-3 text-accent" /> Контакти</span>
              <h2 className="font-display mt-5 text-3xl sm:text-5xl font-black tracking-tight">
                Напиши там, де<br /> тобі зручно.
              </h2>
              <p className="text-muted mt-3">Маєш питання? Пиши або дзвони — відповім швидко.</p>
            </Reveal>
            <Reveal delay={100} className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {cfg?.email && <ContactCard href={`mailto:${cfg.email}`} Icon={Mail} k="Пошта" v={cfg.email} />}
              {cfg?.telegram && <ContactCard href={`https://t.me/${String(cfg.telegram).replace(/^@/, "")}`} Icon={Send} k="Telegram" v={cfg.telegram} />}
              {cfg?.instagram && <ContactCard href={`https://instagram.com/${String(cfg.instagram).replace(/^@/, "")}`} Icon={Instagram} k="Instagram" v={cfg.instagram} />}
              {cfg?.city && <ContactCard className="sm:col-span-2" Icon={MapPin} k="Місто" v={cfg.city} />}
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer className="relative border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 font-bold">
            <span className="h-9 w-9 rounded-xl accent-shine grid place-items-center text-white shadow-glow">
              <Dumbbell className="w-5 h-5" strokeWidth={1.6} />
            </span>
            <div>
              <div className="font-display">Koval<span className="text-gradient">Fit</span></div>
              <div className="text-xs text-muted">Тренування, які працюють.</div>
            </div>
          </div>
          <div className="text-xs text-muted text-center">
            ФОП Ковальчук Дмитро · © {new Date().getFullYear()} KovalFit · Усі права захищено
          </div>
        </div>
      </footer>

      <FloatingContact />
    </main>
  );
}

function ContactCard({ href, Icon, k, v, className = "" }:
  { href?: string; Icon: any; k: string; v: string; className?: string }) {
  const inner = (
    <>
      <span className="h-11 w-11 rounded-2xl border border-border grid place-items-center text-accent shrink-0">
        <Icon className="w-5 h-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs uppercase tracking-widest text-muted">{k}</span>
        <span className="block font-semibold mt-1 break-all">{v}</span>
      </span>
    </>
  );
  return href
    ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`card card-hover card-spot p-5 flex items-center gap-4 ${className}`}>{inner}</a>
    : <div className={`card p-5 flex items-center gap-4 ${className}`}>{inner}</div>;
}

const FALLBACK_REVIEWS = [
  { name: "Олег", meta: "схуднув 12 кг за 4 міс.", rating: 5, text: "Реально працює. Аналітика мотивує — бачу, що щодня роблю крок до цілі." },
  { name: "Ірина", meta: "рекомпозиція", rating: 5, text: "Подобається, що все в одному місці. Тренер бачить, де я халтурю — нікуди не сховаєшся 😅" },
  { name: "Денис", meta: "набір маси", rating: 5, text: "Трекер рекордів і таймери в залі — найзручніше, що пробував. Ще й на телефоні швидко." },
  { name: "Олена", meta: "онлайн · 6 місяців", rating: 5, text: "Мінус 11 кг за пів року, але головне — я нарешті розумію, що роблю в залі." },
  { name: "Андрій", meta: "офлайн · 3 місяці", rating: 5, text: "Спина перестала боліти на 4-му тижні. До цього — два роки без жодного ефекту." },
  { name: "Тетяна", meta: "онлайн · 12 місяців", rating: 5, text: "Найкраща інвестиція року. Тренер, який пише першим, якщо я не відмітила тренування." },
];
