'use client';

import { track as vaTrack } from '@vercel/analytics';

type AllowedPropertyValues = string | number | boolean | null | undefined;

export function trackEvent(name: string, props: Record<string, unknown> = {}) {
  try { vaTrack(name, props as Record<string, AllowedPropertyValues>); } catch {}
}
