import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
]);

export function isPrivateIp(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value.startsWith('::ffff:')) {
    return isPrivateIp(value.slice(7));
  }
  if (value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80')) {
    return true;
  }

  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  return false;
}

export async function assertPublicHttpUrl(raw: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new BadRequestException('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestException('Only http and https URLs are allowed');
  }

  const host = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new BadRequestException('That host cannot be monitored');
  }

  if (isIP(host)) {
    if (isPrivateIp(host)) {
      throw new BadRequestException('Private IP addresses cannot be monitored');
    }
    return parsed.toString();
  }

  const records = await lookup(host, { all: true });
  if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
    throw new BadRequestException('That host cannot be monitored');
  }

  return parsed.toString();
}
