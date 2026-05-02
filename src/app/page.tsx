import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { FAQ } from "@/components/FAQ";
import { FloatingContact } from "@/components/FloatingContact";
import {
  Dumbbell, LineChart, Apple, Pill, Wallet, Camera, Flame, MessageCircle,
  Trophy, ArrowRight, Sparkles, Wifi, Crown, Check, Star, Quote, Target, Zap, ShieldCheck
} from "lucide-react";

export default async function Home() {
  const session = await getSession();
  if (session?.user) {
    if ((session.user as any).role === "TRAINER") redirect("/admin");
    redirect("/dashboard");
  }

  const features = [
    { icon: Apple, title: "Харчування", text: "Персональний план харчування під твої індивідуальні цілі, мої нотатки." },
    { icon: Dumbbell, title: "Тренування", text: "Програма, спліт, техніка, завжди під рукою." },
    { icon: Pill, title: "Добавки", text: "Що, коли і скільки. Без плутанини." },
    { icon: LineChart, title: "Аналітика", text: "Вага, заміри, % жиру. Графіки динаміки." },
    { icon: Camera, title: "Фото-прогрес", text: "Таймлайн до/після зі слайдером порівняння." },
    { icon: Flame, title: "Щоденний check-in", text: "Сон, енергія, настрій. Я бачу все." },
    { icon: Trophy, title: "Досягнення", text: "Streak, віхи ваги, ачівки для мотивації." },
    { icon: MessageCircle, title: "Прямий чат", text: "Пиши мені напряму у кабінеті." },
    { icon: Wallet, title: "Оплати", text: "Історія платежів і статус підписки." },
  ];

  const steps = [
    { n: 1, title: "Знайомство", text: "Розповідаєш про себе, цілі та обмеження. Я підбираю формат під тебе." },
    { n: 2, title: "План під ключ", text: "Отримуєш програму, харчування, добавки і доступ до особистого кабінету." },
    { n: 3, title: "Прогрес щодня", text: "Щодня check-in, тренування, прогрес. Я все бачу і коригую." },
  ];

  const testimonials = [
    { name: "Олег", role: "схуднув 12 кг за 4 міс.", text: "Реально працює. Аналітика мотивує, бачу, що щодня роблю крок до цілі.", rating: 5 },
    { name: "Ірина", role: "рекомпозиція", text: "Подобається, що все в одному місці. Тренер бачить, де я халтурю, нікуди не сховаєшся 😅", rating: 5 },
    { name: "Денис", role: "бодібілдинг", text: "PR-трекер і таймери у залі — найзручніше що пробував. Ще й на телефоні швидко.", rating: 5 },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-bg/70 backdrop-blur-md border-b border-border/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg group">
            <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span>Koval<span className="text-gradient">fit</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#pricing" className="hidden sm:inline-flex btn px-4 py-2 text-sm">Тарифи</a>
            <Link href="/login" className="btn btn-primary px-4 sm:px-5 py-2 text-sm">Увійти</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative">
        {/* Mesh background */}
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full opacity-40 blur-3xl bg-accent/40 animate-gradient-spin" />
          <div className="absolute top-40 -right-32 w-[450px] h-[450px] rounded-full opacity-40 blur-3xl bg-accent2/40 animate-gradient-spin" style={{ animationDelay: "-3s" }} />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-30 blur-3xl bg-[rgb(var(--accent-soft))]" />
          <div className="absolute inset-0 bg-grid bg-[length:32px_32px] opacity-30" />
        </div>

        <div className="max-w-6xl mx-auto px-5 md:px-6 pt-8 md:pt-16 pb-14 md:pb-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            <div className="text-left order-2 md:order-1">
              <Reveal>
                <div className="chip mb-5 md:mb-6">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75"></span>
                    <span className="relative w-2 h-2 rounded-full bg-success"></span>
                  </span>
                  Персональний тренер Дмитро Ковальчук
                </div>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05]">
                  <span className="block">Твій шлях.</span>
                  <span className="block text-gradient">Твої результати!</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="text-muted mt-5 md:mt-6 max-w-xl text-base md:text-lg">
                  Твій кабінет з усім, що потрібно: персональний раціон харчування, індивідуальний план тренувань, супровід з аналізами крові та добавками для корекції дефіцитів організму, прогрес і мій живий контроль.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex flex-wrap gap-3 mt-7 md:mt-8">
                  <Link href="/login" className="btn btn-primary px-6 py-3 group">
                    Почати <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a href="#features" className="btn px-6 py-3">Як це працює</a>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <div className="grid grid-cols-3 gap-3 mt-8 md:mt-10 max-w-md">
                  <Stat value="24/7" label="Підтримка" />
                  <Stat value="100+" label="Клієнтів" />
                  <Stat value="5★" label="Рейтинг" />
                </div>
              </Reveal>
            </div>

            {/* Trainer image */}
            <Reveal delay={120} className="order-1 md:order-2">
              <div className="relative aspect-[4/5] max-w-md mx-auto md:max-w-none">
                <div className="absolute -inset-6 -z-10 opacity-70 blur-3xl rounded-full bg-gradient-to-br from-accent/40 via-accent2/30 to-transparent animate-gradient-spin" />
                <div className="absolute inset-0 rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-accent/10 via-transparent to-accent2/15">
                  <Image
                    src="/trainer.png"
                    alt="Дмитро Ковальчук — персональний тренер"
                    fill priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-bg via-bg/0 to-transparent" />
                </div>
                <div className="absolute -left-3 top-12 chip bg-card/80 backdrop-blur shadow-glow text-xs animate-fade-up" style={{ animationDelay: "300ms" }}>
                  <Sparkles className="w-3 h-3 text-accent" /> 8+ років досвіду
                </div>
                <div className="absolute -right-3 bottom-24 chip bg-card/80 backdrop-blur shadow-glow text-xs animate-fade-up" style={{ animationDelay: "450ms" }}>
                  <Trophy className="w-3 h-3 text-accent2" /> Сертифікований
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 chip bg-card/95 backdrop-blur shadow-glow text-xs animate-fade-up" style={{ animationDelay: "600ms" }}>
                  <Flame className="w-3 h-3 text-accent" /> Онлайн та офлайн супровід
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="max-w-6xl mx-auto px-5 md:px-6 py-14 md:py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <div className="chip mb-4 inline-flex"><Zap className="w-3 h-3 text-accent" /> Як це працює</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Три кроки до результату</h2>
            <p className="text-muted mt-3">Без зайвого. Без води. Тільки те, що приведе до твоєї цілі.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="card p-6 h-full relative overflow-hidden card-hover group">
                <div className="absolute -top-6 -right-6 text-[120px] font-black opacity-5 leading-none select-none">{s.n}</div>
                <div className="w-12 h-12 rounded-2xl accent-shine flex items-center justify-center text-white text-lg font-black shadow-glow">
                  {s.n}
                </div>
                <h3 className="font-bold text-xl mt-4">{s.title}</h3>
                <p className="text-muted text-sm mt-2 leading-relaxed">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-5 md:px-6 py-14 md:py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <div className="chip mb-4 inline-flex"><Target className="w-3 h-3 text-accent" /> Можливості</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Все в одному кабінеті</h2>
            <p className="text-muted mt-3">Не потрібно жонглювати п'ятьма застосунками. Усе тут.</p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 50}>
              <div className="card p-5 md:p-6 card-hover h-full group">
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 group-hover:accent-shine group-hover:text-white transition">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted text-sm mt-1.5 leading-relaxed">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SERVICE / FORMATS */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 md:px-6 py-14 md:py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <div className="chip mb-4 inline-flex"><ShieldCheck className="w-3 h-3 text-accent" /> Послуга</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Два формати супроводу</h2>
            <p className="text-muted mt-3">Обери формат, який підходить твоєму ритму життя.</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          <Reveal delay={0}>
            <PlanCard
              icon={Wifi}
              title="Онлайн"
              tag="тренуєшся сам, я веду в кабінеті"
              perks={[
                "Персональна програма тренувань та харчування",
                "Моніторинг аналізів",
                "Підбір добавок",
                "Щоденний check-in",
                "Чат і звіти",
                "Фото-прогрес",
              ]}
            />
          </Reveal>
          <Reveal delay={120}>
            <PlanCard
              icon={Crown}
              title="Офлайн"
              tag="тренуєшся зі мною в залі особисто!"
              perks={[
                "Персональний план харчування",
                "Особистий кабінет 24/7",
                "Аналітика прогресу",
                "Заплановані сесії",
                "PR-трекер у залі",
              ]}
              featured
            />
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="text-center mt-8 text-sm text-muted">
            Оплата пакетами по 10 тренувань. Без прихованих платежів.
          </div>
        </Reveal>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-5 md:px-6 py-14 md:py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <div className="chip mb-4 inline-flex"><Quote className="w-3 h-3 text-accent" /> Відгуки</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Кажуть наші клієнти</h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div className="card p-6 card-hover h-full flex flex-col">
                <div className="flex gap-0.5 text-accent mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <Quote className="w-6 h-6 text-accent/30" />
                <p className="text-sm md:text-base mt-2 flex-1">{t.text}</p>
                <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl accent-shine flex items-center justify-center text-white font-black">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-5 md:px-6 py-14 md:py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <div className="chip mb-4 inline-flex">❔ Питання</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Часті запитання</h2>
            <p className="text-muted mt-3">Якщо твого питання тут немає, напиши мені у чат.</p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <FAQ />
        </Reveal>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 md:px-6 py-14 md:py-20">
        <Reveal>
          <div className="card p-8 md:p-14 text-center relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 -z-10 opacity-50 bg-gradient-to-br from-accent/30 via-transparent to-accent2/30 animate-gradient-spin" />
            <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-40 blur-3xl bg-accent/40" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Готовий почати?</h2>
            <p className="text-muted mt-3 max-w-lg mx-auto">Напиши мені, і вже завтра у тебе буде особистий план та доступ до кабінету.</p>
            <Link href="/login" className="btn btn-primary px-6 py-3 mt-6 inline-flex group">
              Увійти в кабінет <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg accent-shine flex items-center justify-center text-white">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span>Koval<span className="text-gradient">fit</span></span>
          </div>
          <div className="text-muted text-xs text-center">
            © {new Date().getFullYear()} Kovalfit · Усі права захищено
          </div>
        </div>
      </footer>

      <FloatingContact />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-3 text-center card-hover">
      <div className="text-xl md:text-2xl font-black text-gradient">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{label}</div>
    </div>
  );
}

function PlanCard({ icon: Icon, title, tag, perks, featured }: any) {
  return (
    <div className={`card p-6 md:p-8 h-full relative overflow-hidden ${featured ? "border-accent/50 shadow-glow" : ""} card-hover`}>
      {featured && (
        <div className="absolute top-4 right-4 chip text-[10px] border-accent/40 text-accent">⭐ популярний</div>
      )}
      {featured && <div aria-hidden className="absolute inset-0 -z-10 opacity-20 bg-gradient-to-br from-accent/30 to-accent2/30" />}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${featured ? "accent-shine text-white shadow-glow" : "bg-accent/10 text-accent border border-accent/20"}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-black text-2xl">{title}</h3>
      <p className="text-muted text-sm mt-1">{tag}</p>
      <ul className="mt-5 space-y-2.5">
        {perks.map((p: string) => (
          <li key={p} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{p}</span>
          </li>
        ))}
      </ul>
      <Link href="/login" className={`btn ${featured ? "btn-primary" : ""} mt-6 w-full justify-center`}>
        Дізнатись більше <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

