/// <reference types="astro/client" />

declare namespace App {
  interface SessionData {
    pageViews: number;
    lastVisit: string;
  }
}

interface Window {
    netlifyIdentity: {
        on: (event: string, callback: (user: any) => void) => void;
        open: () => void;
        close: () => void;
    };
} 