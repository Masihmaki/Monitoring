import { BadRequestException } from '@nestjs/common';
import { assertPublicHttpUrl, isPrivateIp } from './url-policy';

describe('url-policy', () => {
  describe('isPrivateIp', () => {
    it('flags common private and loopback ranges', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('10.0.0.5')).toBe(true);
      expect(isPrivateIp('192.168.1.10')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('169.254.1.1')).toBe(true);
      expect(isPrivateIp('::1')).toBe(true);
    });

    it('allows public addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
    });
  });

  describe('assertPublicHttpUrl', () => {
    it('rejects invalid and non-http URLs', async () => {
      await expect(assertPublicHttpUrl('not-a-url')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(assertPublicHttpUrl('ftp://example.com')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects localhost and private IP targets', async () => {
      await expect(
        assertPublicHttpUrl('http://localhost/health'),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        assertPublicHttpUrl('https://127.0.0.1/'),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        assertPublicHttpUrl('http://192.168.0.20/status'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts a public IP http URL', async () => {
      await expect(assertPublicHttpUrl('https://8.8.8.8/')).resolves.toBe(
        'https://8.8.8.8/',
      );
    });
  });
});
