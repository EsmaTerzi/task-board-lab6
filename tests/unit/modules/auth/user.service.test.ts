/**
 * Unit tests for UserService
 */

import { UserService } from '@modules/auth/user.service';
import { truncateAll, getAllUsers } from '@helpers/db.helper';

describe('UserService', () => {
  let service: UserService;

  beforeAll(() => {
    service = new UserService();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  describe('register()', () => {
    it('should create a new user with hashed password', async () => {
      const user = await service.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.password_hash).not.toBe('SecurePass123!');
      expect(user.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should normalize email to lowercase', async () => {
      const user = await service.register({
        email: 'Test@EXAMPLE.com',
        password: 'SecurePass123!',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should throw conflict error on duplicate email', async () => {
      await service.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'DifferentPass456!',
        })
      ).rejects.toThrow('already exists');
    });

    it('should preserve case-insensitive duplicate detection', async () => {
      await service.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      await expect(
        service.register({
          email: 'TEST@EXAMPLE.COM',
          password: 'SecurePass123!',
        })
      ).rejects.toThrow();
    });
  });

  describe('findByEmail()', () => {
    it('should return user when found', async () => {
      await service.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      const user = await service.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when not found', async () => {
      const user = await service.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should match case-insensitively', async () => {
      await service.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      const user = await service.findByEmail('TEST@EXAMPLE.COM');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });
  });
});
