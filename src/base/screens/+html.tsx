import { ScrollViewStyleReset } from 'expo-router/html'
import type { ReactNode } from 'react'

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/logo.jpg" />
        <link rel="shortcut icon" href="/logo.jpg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.jpg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/logo.jpg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo.jpg" />
        <link rel="apple-touch-icon" sizes="120x120" href="/logo.jpg" />
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
        `}</style>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  )
}
