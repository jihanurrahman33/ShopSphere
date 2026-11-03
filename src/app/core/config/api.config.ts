import { InjectionToken } from '@angular/core';

/** Base URL of the REST API (DIP: consumers depend on the token, not a literal). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = (window as unknown as { __SHOPSPHERE_API_URL__?: string }).__SHOPSPHERE_API_URL__;
    if (custom) return custom;

    const hostname = window.location.hostname;
    // When running in production on Vercel or any non-local domain, route through /api
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
  }
  return 'http://localhost:3000';
}

export const DEFAULT_API_BASE_URL = getApiBaseUrl();
