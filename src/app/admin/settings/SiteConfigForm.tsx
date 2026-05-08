"use client";
import { useState, useTransition } from "react";
import { saveSiteConfig } from "./actions";
import { Phone, Mail, MapPin, Instagram, Send, Tag, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

type Cfg = {
  phone?: string | null; email?: string | null; city?: string | null;
  instagram?: string | null; telegram?: string | null;
  priceOnline?: string | null; priceOffline?: string | null; priceNote?: string | null;
} | null;

export function SiteConfigForm({ initial }: { initial: Cfg }) {
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram ?? "");
  const [telegram, setTelegram] = useState(initial?.telegram ?? "");
  const [priceOnline, setPriceOnline] = useState(initial?.priceOnline ?? "");
  const [priceOffline, setPriceOffline] = useState(initial?.priceOffline ?? "");
  const [priceNote, setPriceNote] = useState(initial?.priceNote ?? "пакет 10 тренувань");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await saveSiteConfig({ phone, email, city, instagram, telegram, priceOnline, priceOffline, priceNote });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Налаштування сайту</h1>
        <p className="text-sm text-muted mt-0.5">
          Контакти і ціни відображаються на публічному лендингу —{" "}
          <a href="/" target="_blank" className="text-accent underline inline-flex items-center gap-1">
            переглянути <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Contacts block */}
        <div className="card overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
          <div className="p-5 space-y-4">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-accent" /> Контакти
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label flex items-center gap-1.5"><Phone className="w-3 h-3" /> Телефон</label>
                <input className="input" placeholder="+38 050 000 00 00" value={phone}
                  onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</label>
                <input className="input" type="email" placeholder="coach@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Місто / Адреса</label>
                <input className="input" placeholder="Київ, Україна" value={city}
                  onChange={e => setCity(e.target.value)} />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Instagram className="w-3 h-3" /> Instagram (username)</label>
                <input className="input" placeholder="_dmytro_kovalchuk_coach" value={instagram}
                  onChange={e => setInstagram(e.target.value)} />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Send className="w-3 h-3" /> Telegram (username)</label>
                <input className="input" placeholder="dmytro_kovalchuk_coach" value={telegram}
                  onChange={e => setTelegram(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing block */}
        <div className="card overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent2))] to-[rgb(var(--accent))]" />
          <div className="p-5 space-y-4">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" /> Ціни на послуги
            </div>
            <div className="text-xs text-muted">Відображаються у розділі «Тарифи» на лендингу. Потрібні для Mono Pay.</div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Ціна Онлайн (грн)</label>
                <div className="relative">
                  <input className="input pr-8" placeholder="4 000" value={priceOnline}
                    onChange={e => setPriceOnline(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">₴</span>
                </div>
              </div>
              <div>
                <label className="label">Ціна Офлайн (грн)</label>
                <div className="relative">
                  <input className="input pr-8" placeholder="5 000" value={priceOffline}
                    onChange={e => setPriceOffline(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">₴</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Підпис до ціни</label>
                <input className="input" placeholder="пакет 10 тренувань" value={priceNote}
                  onChange={e => setPriceNote(e.target.value)} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-muted">
              💡 Для <b>Mono Pay</b>: після заповнення цін на лендингу — вкажи URL свого сайту при подачі заявки.
              Це підтвердить наявність інформації про послуги.
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary gap-2">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Зберегти
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="w-4 h-4" /> Збережено!
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
