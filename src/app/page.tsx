import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Dumbbell, LineChart, Apple, Pill, Wallet, Camera, Flame, MessageCircle, Trophy, ArrowRight, Sparkles } from "lucide-react";

export default async function Home() {
  const session = await getSession();
  if (session?.user) {
    if ((session.user as any).role === "TRAINER") redirect("/admin");
    redirect("/dashboard");
  }

  const features = [
    { icon: Apple, title: "Харчування", text: "Повний план з калоріями та БЖУ, нотатки тренера." },
    { icon: Dumbbell, title: "Тренування", text: "Програма, сплит, техніка — завжди під рукою." },
    { icon: Pill, title: "Добавки", text: "Що, коли і скільки — без плутанини." },
    { icon: LineChart, title: "Аналітика", text: "Вага, заміри, % жиру — графіки динаміки." },
    { icon: Camera, title: "Фото-прогрес", text: "Таймлайн до/після зі слайдером порівняння." },
    { icon: Flame, title: "Щоденний check-in", text: "Сон, енергія, настрій — тренер бачить все." },
    { icon: Trophy, title: "Досягнення", text: "Streak, віхи ваги, ачівки для мотивації." },
    { icon: MessageCircle, title: "Чат з тренером", text: "Пряме спілкування в особистому кабінеті." },
    { icon: Wallet, title: "Оплати", text: "Історія платежів і статус підписки." },
  ];

  return (
    <div className="min-h-screen h-gradient">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white">
            <Dumbbell className="w-5 h-5" />
          </div>
          KOVAL<span className="text-accent">.coach</span>
        </div>
        <Link href="/login" className="btn btn-primary">Увійти</Link>
      </nav>

      <section className="max-w-6xl mx-auto px-5 md:px-6 pt-6 md:pt-12 pb-12 md:pb-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          {/* Left — текст */}
          <div className="text-left animate-fade-up order-2 md:order-1">
            <div className="chip mb-5 md:mb-6">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75"></span>
                <span className="relative w-2 h-2 rounded-full bg-success"></span>
              </span>
              Персональний тренер Дмитро Ковальчук
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05]">
              <span className="block">Твій шлях.</span>
              <span className="block text-gradient">Твої результати.</span>
            </h1>
            <p className="text-muted mt-5 md:mt-6 max-w-xl text-base md:text-lg">
              Кабінет клієнта з усім, що потрібно — харчування, тренування,
              добавки, прогрес та живий контроль тренера.
            </p>
            <div className="flex flex-wrap gap-3 mt-7 md:mt-8">
              <Link href="/login" className="btn btn-primary px-6 py-3 group">
                Вхід у кабінет <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="btn px-6 py-3">Дізнатися більше</a>
            </div>

            {/* mini stats */}
            <div className="grid grid-cols-3 gap-3 mt-8 md:mt-10 max-w-md">
              <Stat value="24/7" label="Підтримка" />
              <Stat value="100+" label="Клієнтів" />
              <Stat value="5★" label="Рейтинг" />
            </div>
          </div>

          {/* Right — фото тренера */}
          <div className="relative order-1 md:order-2 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="relative aspect-[4/5] max-w-md mx-auto md:max-w-none">
              {/* glow blobs */}
              <div className="absolute -inset-6 -z-10 opacity-70 blur-3xl rounded-full bg-gradient-to-br from-accent/40 via-accent2/30 to-transparent animate-gradient-spin" />
              <div className="absolute inset-0 rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-accent/10 via-transparent to-accent2/15">
                <Image
                  src="/trainer.png"
                  alt="Дмитро Ковальчук — персональний тренер"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                {/* shine overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-bg via-bg/0 to-transparent" />
              </div>

              {/* floating badges */}
              <div className="absolute -left-3 top-12 chip bg-card/80 backdrop-blur shadow-glow text-xs animate-fade-up" style={{ animationDelay: "300ms" }}>
                <Sparkles className="w-3 h-3 text-accent" /> 8+ років досвіду
              </div>
              <div className="absolute -right-3 bottom-24 chip bg-card/80 backdrop-blur shadow-glow text-xs animate-fade-up" style={{ animationDelay: "450ms" }}>
                <Trophy className="w-3 h-3 text-accent2" /> Сертифікований
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 chip bg-card/95 backdrop-blur shadow-glow text-xs animate-fade-up" style={{ animationDelay: "600ms" }}>
                <Flame className="w-3 h-3 text-accent" /> Онлайн та офлайн ведення
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-5 md:px-6 pb-16 md:pb-24 grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {features.map((f) => (
          <div key={f.title} className="card p-6 hover:border-accent/40 transition">
            <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center text-accent mb-4">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-muted text-sm mt-1">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-muted text-sm">
        © {new Date().getFullYear()} Koval Coach · Усі права захищено
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-xl md:text-2xl font-black text-gradient">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{label}</div>
    </div>
  );
}
