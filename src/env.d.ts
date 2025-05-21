/// <reference types="astro/client" />

// Remove all session-related type definitions 

declare namespace App {
  interface SessionData {
    pageViews: number;
    lastVisit: string;
  }
} 