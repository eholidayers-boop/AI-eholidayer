export function logEvent(name: string, props: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), event: name, ...props });
  console.log(line);
}

export function logError(err: unknown, ctx: Record<string, unknown> = {}): void {
  const e = err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) };
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', ...e, ...ctx }));
}
