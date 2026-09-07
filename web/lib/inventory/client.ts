import type { AvailabilityQuery, AvailabilityResult, Destination, Hotel, HotelDetail, RoomOption, Review, SearchQuery, User } from './types';

export interface InventoryClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: { search?: number; detail?: number };
  maxRetries?: number;
}

export class InventoryClient {
  constructor(
    private baseUrl: string,
    private apiToken: string,
    private opts: InventoryClientOptions = {}
  ) {}

  private async fetchJson<T>(path: string, init: RequestInit = {}, timeoutMs = 3000): Promise<T> {
    const f = this.opts.fetchImpl ?? fetch;
    const url = `${this.baseUrl}${path}`;
    const headers = { 'X-API-Token': this.apiToken, ...(init.headers || {}) };

    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= (this.opts.maxRetries ?? 2); attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await f(url, { ...init, headers, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) {
          if (res.status >= 500 && attempt < (this.opts.maxRetries ?? 2)) {
            await new Promise(r => setTimeout(r, 200 * 2 ** attempt));
            continue;
          }
          throw new Error(`Legacy ${res.status}: ${await res.text()}`);
        }
        return await res.json() as T;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        if (attempt < (this.opts.maxRetries ?? 2)) {
          await new Promise(r => setTimeout(r, 200 * 2 ** attempt));
          continue;
        }
      }
    }
    throw lastErr ?? new Error('Unknown error');
  }

  searchHotels(q: SearchQuery): Promise<{ hotels: Hotel[]; total: number; page: number }> {
    const params = new URLSearchParams();
    if (q.destination) params.set('destination', q.destination);
    if (q.category) params.set('category', String(q.category));
    if (q.minPrice) params.set('minPrice', String(q.minPrice));
    if (q.maxPrice) params.set('maxPrice', String(q.maxPrice));
    if (q.page) params.set('page', String(q.page));
    if (q.pageSize) params.set('pageSize', String(q.pageSize));
    return this.fetchJson(`/api/v1/hotels?${params}`, {}, this.opts.timeoutMs?.search ?? 3000);
  }

  getHotelDetails(id: string): Promise<{ hotel: HotelDetail }> {
    return this.fetchJson(`/api/v1/hotels/${encodeURIComponent(id)}`, {}, this.opts.timeoutMs?.detail ?? 2000);
  }

  getRoomOptions(id: string): Promise<{ rooms: RoomOption[] }> {
    return this.fetchJson(`/api/v1/hotels/${encodeURIComponent(id)}/rooms`, {}, this.opts.timeoutMs?.detail ?? 2000);
  }

  getAvailability(q: AvailabilityQuery): Promise<{ hotels: AvailabilityResult[] }> {
    const params = new URLSearchParams({ destination: q.destination, checkIn: q.checkIn, checkOut: q.checkOut });
    if (q.guests) params.set('guests', String(q.guests));
    return this.fetchJson(`/api/v1/availability?${params}`, {}, this.opts.timeoutMs?.search ?? 3000);
  }

  getReviews(filter: { hotelId?: string; destination?: string; minRating?: number }): Promise<{ reviews: Review[] }> {
    const params = new URLSearchParams();
    if (filter.hotelId) params.set('hotelId', filter.hotelId);
    if (filter.destination) params.set('destination', filter.destination);
    if (filter.minRating) params.set('minRating', String(filter.minRating));
    return this.fetchJson(`/api/v1/reviews?${params}`, {}, this.opts.timeoutMs?.detail ?? 2000);
  }

  getDestinations(): Promise<{ destinations: Destination[] }> {
    return this.fetchJson(`/api/v1/destinations`);
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const body = JSON.stringify({ email, password });
    return this.fetchJson('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }, 2000);
  }
}
