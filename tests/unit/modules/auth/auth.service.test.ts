/**
 * Unit tests for AuthService
 */

import { AuthService } from '@modules/auth/auth.service';
import { TokenService } from '@modules/auth/token.service';
import { UserService } from '@modules/auth/user.service';
import { truncateAll } from '@helpers/db.helper';

describe('AuthService.login()', () => {
  let authService: AuthService;
  let userService: UserService;
  let tokenService: TokenService;

  beforeAll(() => {
    userService = new UserService();
    tokenService = new TokenService();
    authService = new AuthService(userService, tokenService);
  });

  beforeEach(async () => {
    await truncateAll();
  });

  it('should return access token for correct credentials', async () => {
    const email = 'test@example.com';
    const password = 'SecurePass123!';

    // Register user
    await userService.register({ email, password });

    // Login
    const result = await authService.login({ email, password });

    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe('string');
    expect(result.accessToken.split('.')).toHaveLength(3); // JWT format
  });

  it('should throw error for wrong password', async () => {
    const email = 'test@example.com';
    const password = 'SecurePass123!';

    // Register user
    await userService.register({ email, password });

    // Try to login with wrong password
    await expect(
      authService.login({ email, password: 'WrongPassword456!' })
    ).rejects.toThrow();
  });

  it('should throw error for unknown email', async () => {
    // Try to login with non-existent email
    await expect(
      authService.login({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      })
    ).rejects.toThrow();
  });

  it('should normalize email to lowercase', async () => {
    const email = 'Test@EXAMPLE.com';
    const password = 'SecurePass123!';

    // Register with original case
    await userService.register({ email, password });

    // Login with different case
    const result = await authService.login({
      email: 'test@example.com',
      password,
    });

    expect(result.accessToken).toBeDefined();
  });

  it('should always run bcrypt comparison (constant-time)', async () => {
    const email = 'test@example.com';
    const password = 'SecurePass123!';

    // Register user
    await userService.register({ email, password });

    // This test verifies bcrypt.compare is called even for non-existent users
    // by ensuring that login attempts take similar time regardless of whether
    // the user exists. Implementation uses dummy hash comparison for unknown users.

    const startNonExistent = Date.now();
    try {
      await authService.login({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      });
    } catch {
      // Expected to fail
    }
    const durationNonExistent = Date.now() - startNonExistent;

    const startWrongPassword = Date.now();
    try {
      await authService.login({ email, password: 'WrongPassword456!' });
    } catch {
      // Expected to fail
    }
    const durationWrongPassword = Date.now() - startWrongPassword;

    // Durations should be similar (both run bcrypt)
    // Allow 100ms variance for system variance
    expect(Math.abs(durationNonExistent - durationWrongPassword)).toBeLessThan(
      100
    );
  });
});

describe('AuthService.logout()', () => {
  let authService: AuthService;
  let userService: UserService;
  let tokenService: TokenService;

  beforeAll(() => {
    userService = new UserService();
    tokenService = new TokenService();
    authService = new AuthService(userService, tokenService);
  });

  beforeEach(async () => {
    await truncateAll();
  });

  it('should blocklist token on logout', async () => {
    const email = 'test@example.com';
    const password = 'SecurePass123!';

    // Register and login
    await userService.register({ email, password });
    const { accessToken } = await authService.login({ email, password });

    // Logout
    await authService.logout(accessToken);

    // Token should now be blocklisted and verify should throw
    expect(() => tokenService.verify(accessToken)).toThrow(/blocklist/i);
  });

  it('should be idempotent (multiple logouts same token)', async () => {
    const email = 'test@example.com';
    const password = 'SecurePass123!';

    // Register and login
    await userService.register({ email, password });
    const { accessToken } = await authService.login({ email, password });

    // Logout twice
    await authService.logout(accessToken);
    await expect(authService.logout(accessToken)).resolves.not.toThrow();
  });
});
