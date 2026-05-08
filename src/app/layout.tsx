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

// Splash overlay shown immediately on first paint, fades out once the page is loaded.
// Lives outside React tree so React hydration doesn't strip/re-render it.
const splashScript = `
(function(){
  var start = Date.now();
  var MIN_SHOW = 500;
  function hide(){
    var wait = Math.max(0, MIN_SHOW - (Date.now() - start));
    setTimeout(function(){
      var el = document.getElementById('app-splash');
      if (!el) return;
      el.classList.add('hide');
      setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 500);
    }, wait);
  }
  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
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
