/**
 * Unit tests for TokenService
 */

import { TokenService } from '@modules/auth/token.service';
import { makeToken, makeExpiredToken, decodeToken } from '@helpers/jwt.helper';
import { truncateTable, getAllBlocklistedTokens } from '@helpers/db.helper';
import { randomUUID } from 'crypto';

describe('TokenService', () => {
  let service: TokenService;
  const testUserId = randomUUID();

  beforeAll(() => {
    service = new TokenService();
  });

  beforeEach(async () => {
    await truncateTable('token_blocklist');
  });

  describe('issue()', () => {
    it('should return a valid JWT token', async () => {
      const token = await service.issue(testUserId);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should include user ID in sub claim', async () => {
      const token = await service.issue(testUserId);
      const payload = decodeToken(token) as any;

      expect(payload.sub).toBe(testUserId);
    });

    it('should include unique jti claim', async () => {
      const token1 = await service.issue(testUserId);
      const token2 = await service.issue(testUserId);

      const payload1 = decodeToken(token1) as any;
      const payload2 = decodeToken(token2) as any;

      expect(payload1.jti).toBeDefined();
      expect(payload2.jti).toBeDefined();
      expect(payload1.jti).not.toBe(payload2.jti);
    });

    it('should have exp claim set to 24 hours from now', async () => {
      const beforeIssue = Math.floor(Date.now() / 1000);
      const token = await service.issue(testUserId);
      const afterIssue = Math.floor(Date.now() / 1000);

      const payload = decodeToken(token) as any;
      const expectedExpiration = beforeIssue + 86400; // 24 hours in seconds

      // Allow 5 second margin for test execution
      expect(payload.exp).toBeGreaterThanOrEqual(expectedExpiration - 5);
      expect(payload.exp).toBeLessThanOrEqual(expectedExpiration + 5);
    });
  });

  describe('verify()', () => {
    it('should return decoded payload for valid token', async () => {
      const token = await service.issue(testUserId);
      const payload = service.verify(token) as any;

      expect(payload.sub).toBe(testUserId);
      expect(payload.jti).toBeDefined();
    });

    it('should throw error for expired token', async () => {
      const expiredToken = makeExpiredToken(testUserId);

      expect(() => service.verify(expiredToken)).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => service.verify('invalid.token.here')).toThrow();
    });

    it('should throw error for token with alg: none', () => {
      // Manually craft a token with alg: none (should be rejected)
      const invalidToken =
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.';

      expect(() => service.verify(invalidToken)).toThrow();
    });

    it('should throw error for blocklisted token', async () => {
      const token = await service.issue(testUserId);
      const payload = decodeToken(token) as any;

      // Manually blocklist the token
      await service.blocklist(payload.jti);

      expect(() => service.verify(token)).toThrow(/blocklist/i);
    });
  });

  describe('isBlocklisted()', () => {
    it('should return false for new token', async () => {
      const token = await service.issue(testUserId);
      const payload = decodeToken(token) as any;

      const isBlocklisted = await service.isBlocklisted(payload.jti);

      expect(isBlocklisted).toBe(false);
    });

    it('should return true for blocklisted token', async () => {
      const token = await service.issue(testUserId);
      const payload = decodeToken(token) as any;

      await service.blocklist(payload.jti);

      const isBlocklisted = await service.isBlocklisted(payload.jti);

      expect(isBlocklisted).toBe(true);
    });
  });

  describe('blocklist()', () => {
    it('should add token jti to blocklist', async () => {
      const token = await service.issue(testUserId);
      const payload = decodeToken(token) as any;

      await service.blocklist(payload.jti);

      const blocklisted = await getAllBlocklistedTokens();
      expect(blocklisted.length).toBe(1);
      expect(blocklisted[0].jti).toBe(payload.jti);
    });

    it('should be idempotent (no duplicates on re-blocklist)', async () => {
      const token = await service.issue(testUserId);
      const payload = decodeToken(token) as any;

      await service.blocklist(payload.jti);
      await service.blocklist(payload.jti); // Blocklist same token again

      const blocklisted = await getAllBlocklistedTokens();
      expect(blocklisted.length).toBe(1); // Only one entry
    });
  });

  describe('revokeAllForUser()', () => {
    it('should not fail when no tokens exist for user', async () => {
      // Should not throw
      await expect(service.revokeAllForUser(randomUUID())).resolves.not.toThrow();
    });
  });
});
