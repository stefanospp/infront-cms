/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  interface Env {
    DB: D1Database;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    RESEND_API_KEY: string;
  }
}
