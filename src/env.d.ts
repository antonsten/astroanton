/// <reference types="astro/client" />

declare namespace App {
  interface SessionData {
    pageViews: number;
    lastVisit: string;
  }
} 