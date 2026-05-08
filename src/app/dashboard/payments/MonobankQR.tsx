"use client";
import { QRCodeSVG } from "qrcode.react";
import { ExternalLink, Smartphone } from "lucide-react";

export function MonobankQR({ url }: { url: string }) {
  if (!url) return null;

  return (
    <div className="card mb-6 overflow-hidden">
      {/* Accent top strip */}
      <div className="h-[3px] bg-gradient-to-r from-[#1BA5C8] to-[#3BC8E7]" />

      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          {/* Monobank cat icon placeholder */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#1BA5C8]/15 border border-[#1BA5C8]/25">
            <Smartphone className="w-5 h-5 text-[#1BA5C8]" />
          </div>
          <div>
            <div className="font-semibold text-sm">Оплатити через Monobank</div>
            <div className="text-xs text-muted">Скануй QR або натисни кнопку</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* QR Code */}
          <div className="shrink-0 p-3 rounded-2xl bg-white shadow-md border border-border">
            <QRCodeSVG
              value={url}
              size={160}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-sm text-muted leading-relaxed mb-4">
              Відкрий камеру телефону і наведи на QR — Monobank відкриється з уже заповненими даними. Залишиться тільки ввести суму і підтвердити.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary gap-2 w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Відкрити в Monobank
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
