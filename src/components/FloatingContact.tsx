"use client";
import { useState, useEffect } from "react";
import { Send, MessageCircle, Phone, Instagram, X } from "lucide-react";

const TELEGRAM = "https://t.me/dmytro_kovalchuk"; // замінити на свій
const INSTAGRAM = "https://instagram.com/dmytro_kovalchuk"; // замінити на свій
const PHONE = "+380501112233"; // замінити на свій

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`fixed right-4 md:right-6 bottom-4 md:bottom-6 z-40 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
      {/* Buttons stack */}
      <div className={`flex flex-col items-end gap-2 mb-2 transition-all duration-300 ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <ContactBtn href={TELEGRAM} label="Telegram" icon={Send} color="#0088cc" />
        <ContactBtn href={INSTAGRAM} label="Instagram" icon={Instagram} color="#e1306c" />
        <ContactBtn href={`tel:${PHONE}`} label={PHONE} icon={Phone} color="rgb(var(--success))" />
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-2xl accent-shine text-white flex items-center justify-center shadow-glow active:scale-90 transition-transform relative"
        aria-label="Контакти"
      >
        {!open && <span className="absolute inset-0 rounded-2xl animate-ping bg-accent/40 -z-10" />}
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}

function ContactBtn({ href, label, icon: Icon, color }: any) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-card/95 backdrop-blur border border-border shadow-glow hover:-translate-x-1 transition-transform">
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: color }}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
