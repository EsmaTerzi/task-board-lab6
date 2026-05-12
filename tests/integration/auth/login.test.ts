/**
 * Integration tests for login endpoint
 */

import request from 'supertest';
import { createApp } from '../../../src/app';
import { Express } from 'express';
import { truncateAll } from '../../helpers/db.helper';
import { UserService } from '../../../src/modules/auth/user.service';

describe('POST /auth/login', () => {
  let app: Express;
  let userService: UserService;

  beforeAll(() => {
    app = createApp();
    userService = new UserService();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  describe('Happy path', () => {
    it('should return 200 with access token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // Register user first
      await userService.register({ email, password });

      // Login
      const response = await request(app).post('/auth/login').send({
        email,
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.split('.')).toHaveLength(3);
    });
  });

  describe('Error cases', () => {
    it('should return 401 for wrong password', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // Register user
      await userService.register({ email, password });

      // Try wrong password
      const response = await request(app).post('/auth/login').send({
        email,
        password: 'WrongPassword456!',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials.');
    });

    it('should return 401 for unknown email', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials.');
    });

    it('should return identical response for wrong password and unknown email', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // Register user
      await userService.register({ email, password });

      // Try wrong password
      const wrongPasswordResponse = await request(app).post('/auth/login').send({
        email,
        password: 'WrongPassword456!',
      });

      // Try unknown email
      const unknownEmailResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      // Both should return same status and message
      expect(wrongPasswordResponse.status).toBe(
        unknownEmailResponse.status
      );
      expect(wrongPasswordResponse.body.message).toBe(
        unknownEmailResponse.body.message
      );
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'not-an-email',
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app).post('/auth/login').send({
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Email normalization', () => {
    it('should accept login with uppercase email', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // Register with lowercase
      await userService.register({ email, password });

      // Login with uppercase
      const response = await request(app).post('/auth/login').send({
        email: 'TEST@EXAMPLE.COM',
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should accept login with mixed case email', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // Register with lowercase
      await userService.register({ email, password });

      // Login with mixed case
      const response = await request(app).post('/auth/login').send({
        email: 'Test@Example.Com',
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });
  });
});
