import { ScrollViewStyleReset } from 'expo-router/html'
import type { ReactNode } from 'react'

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SessionPlanner" />
        <meta name="mobile-web-app-capable" content="yes" />
        <style>{`
          html, body, #root {
            width: 100%;
            max-width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            -webkit-text-size-adjust: 100%;
          }
          body {
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
          #portrait-lock-overlay {
            display: none;
          }
          @media screen and (orientation: landscape) {
            #root {
              visibility: hidden;
              pointer-events: none;
            }
            #portrait-lock-overlay {
              position: fixed;
              inset: 0;
              z-index: 2147483647;
              display: flex;
              align-items: center;
              justify-content: center;
              padding-left: max(20px, env(safe-area-inset-left));
              padding-right: max(20px, env(safe-area-inset-right));
              padding-top: max(20px, env(safe-area-inset-top));
              padding-bottom: max(20px, env(safe-area-inset-bottom));
              background: #ffffff;
            }
            #portrait-lock-overlay-card {
              width: 100%;
              max-width: 360px;
              border-radius: 16px;
              border: 1px solid #e5e7eb;
              padding: 16px;
              text-align: center;
              box-sizing: border-box;
              background: #ffffff;
              color: #111827;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            #portrait-lock-overlay-title {
              margin: 0 0 8px 0;
              font-size: 20px;
              font-weight: 700;
              color: #009688;
            }
            #portrait-lock-overlay-text {
              margin: 0;
              font-size: 14px;
              line-height: 20px;
            }
          }
        `}</style>
        <ScrollViewStyleReset />
      </head>
      <body>
        <div id="portrait-lock-overlay" aria-hidden="true">
          <div id="portrait-lock-overlay-card">
            <p id="portrait-lock-overlay-title">Mode portrait requis</p>
            <p id="portrait-lock-overlay-text">Tourne ton appareil en portrait pour continuer.</p>
          </div>
        </div>
        {children}
      </body>
    </html>
  )
}
