import { backendUrl } from "./settings";

const beDir = new URL(`${backendUrl}/`);

export function imageResourceUrl(
  path: string,
  options: Record<string, any> = {}
): string {
  const u = new URL(backendUrl);
  u.pathname = `/${path}`;
  u.pathname = `${beDir.pathname}images${u.pathname}`;
  for (const [key, value] of Object.entries(options)) {
    u.searchParams.set(key, String(value));
  }
  return u.href;
}
