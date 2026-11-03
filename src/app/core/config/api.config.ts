import { InjectionToken } from '@angular/core';

/** Base URL of the REST API (DIP: consumers depend on the token, not a literal). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export const DEFAULT_API_BASE_URL = 'http://localhost:3000';
