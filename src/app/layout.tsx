import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "KovalFit — Персональні тренування",
  description: "Кабінет клієнта: харчування, тренування, прогрес, аналітика.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "KovalFit" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090b1a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6ff" },
  ],
};

const themeInit = `
(function(){try{var t=localStorage.getItem('theme');if(!t)t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

// Inline splash CSS — must apply on first paint, before globals.css loads.
const splashCss = `
html[data-theme="dark"] #app-splash{--bg:9 11 26;--text:233 235 245;--border:38 41 64;--accent:99 102 241;--accent2:59 130 246}
html[data-theme="light"] #app-splash,#app-splash{--bg:244 246 255;--text:15 18 38;--border:228 231 240;--accent:99 102 241;--accent2:59 130 246}
html[data-theme="dark"] #app-splash{--bg:9 11 26;--text:233 235 245}
#app-splash{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.25rem;background:radial-gradient(circle at 50% 30%,rgb(var(--accent)/.18),transparent 60%),radial-gradient(circle at 50% 90%,rgb(var(--accent2)/.12),transparent 55%),rgb(var(--bg));transition:opacity .45s ease,visibility .45s ease;-webkit-tap-highlight-color:transparent}
#app-splash.hide{opacity:0;visibility:hidden;pointer-events:none}
#app-splash .splash-glow{position:absolute;width:360px;height:360px;border-radius:9999px;background:radial-gradient(circle,rgb(var(--accent)/.35),transparent 60%);filter:blur(60px);opacity:.7;animation:splash-glow 4s ease-in-out infinite;pointer-events:none}
#app-splash .splash-logo{position:relative;width:84px;height:84px;border-radius:24px;background:linear-gradient(135deg,rgb(var(--accent2)),rgb(var(--accent)));display:grid;place-items:center;color:#fff;box-shadow:0 12px 40px -8px rgb(var(--accent)/.55),0 4px 16px -4px rgb(var(--accent2)/.45),inset 0 1px 0 rgba(255,255,255,.18);animation:splash-pop .6s cubic-bezier(.2,.9,.3,1.4) both,splash-pulse 2.4s ease-in-out infinite .6s}
#app-splash .splash-logo svg{width:42px;height:42px}
#app-splash .splash-text{font-size:1.75rem;font-weight:900;letter-spacing:-.02em;color:rgb(var(--text));font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;animation:splash-fade-up .55s ease-out both .15s}
#app-splash .splash-text span{background:linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent2)));-webkit-background-clip:text;background-clip:text;color:transparent}
#app-splash .splash-spinner{width:32px;height:4px;border-radius:9999px;background:rgb(var(--border));position:relative;overflow:hidden;margin-top:.25rem;opacity:0;animation:splash-fade-up .55s ease-out both .35s}
#app-splash .splash-spinner::after{content:"";position:absolute;inset:0;width:40%;border-radius:9999px;background:linear-gradient(90deg,rgb(var(--accent)),rgb(var(--accent2)));animation:splash-bar 1.2s ease-in-out infinite}
@keyframes splash-pop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes splash-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes splash-fade-up{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes splash-glow{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.15);opacity:1}}
@keyframes splash-bar{0%{left:-45%}100%{left:105%}}
`;

// Splash overlay shown immediately on first paint, fades out as soon as the
// DOM is ready (NOT window.load — that waits for every image/asset, which made
// heavy pages keep the splash up for seconds). Hard cap so it never lingers.
// Lives outside React tree so React hydration doesn't strip/re-render it.
const splashScript = `
(function(){
  var start = Date.now();
  var MIN_SHOW = 350;   // brief so the logo doesn't just flicker
  var MAX_SHOW = 1500;  // hard cap — never hang longer than this
  var done = false;
  function hide(){
    if (done) return; done = true;
    var wait = Math.max(0, MIN_SHOW - (Date.now() - start));
    setTimeout(function(){
      var el = document.getElementById('app-splash');
      if (!el) return;
      el.classList.add('hide');
      setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 450);
    }, wait);
  }
  // Hide as soon as the document is interactive (DOM parsed) — don't wait for images
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    hide();
  } else {
    document.addEventListener('DOMContentLoaded', hide);
  }
  // Safety net: force-hide after MAX_SHOW no matter what
  setTimeout(hide, MAX_SHOW);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <style dangerouslySetInnerHTML={{ __html: splashCss }} />
      </head>
      <body>
        {/* App splash — shown until window 'load' fires */}
        <div id="app-splash" aria-hidden="true">
          <div className="splash-glow" aria-hidden="true" />
          <div className="splash-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.4 14.4 9.6 9.6"/>
              <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
              <path d="m21.5 21.5-1.4-1.4"/>
              <path d="M3.9 3.9 2.5 2.5"/>
              <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
            </svg>
          </div>
          <div className="splash-text">Koval<span>Fit</span></div>
          <div className="splash-spinner" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
