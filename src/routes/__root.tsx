// src/routes/__root.tsx
/// <reference types="vite/client" />
import type { ReactNode } from 'react';
import appCss from '../styles/app.css?url';
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { Provider } from 'jotai';
import { AuthProvider } from '@/hooks/use-auth-initializer';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='fa-IR'>
      <head>
        <HeadContent />
      </head>
      <body dir='rtl'>
        <Provider>
          <AuthProvider>
            {children}
            <Scripts />
            <Toaster richColors />
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
