const baseUrl = new URL(window.location.origin);

export function imageResourceUrl(
  path: string,
  options: Record<string, any> = {}
): string {
  const u = new URL(baseUrl);
  u.pathname = `/${path}`;
  u.pathname = `/.be/images${u.pathname}`;
  for (const [key, value] of Object.entries(options)) {
    u.searchParams.set(key, String(value));
  }
  console.log(path, u.href);
  return u.href;
}
