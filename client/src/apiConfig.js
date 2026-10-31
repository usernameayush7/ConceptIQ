// Base API URL configuration
// In local development, defaults to relative path ('') which is proxied by Vite
// In production (Vercel), uses VITE_API_URL if configured, or relative path
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
