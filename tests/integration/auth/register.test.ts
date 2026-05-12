/**
 * Integration tests for registration endpoint
 */

import request from 'supertest';
import { createApp } from '../../../src/app';
import { Express } from 'express';
import { truncateAll } from '../../helpers/db.helper';

describe('POST /auth/register', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  describe('Happy path', () => {
    it('should return 201 with user id for valid credentials', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');
    });
  });

  describe('Error cases', () => {
    it('should return 409 for duplicate email', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // First registration
      const firstResponse = await request(app).post('/auth/register').send({
        email,
        password,
      });
      expect(firstResponse.status).toBe(201);

      // Second registration with same email
      const secondResponse = await request(app).post('/auth/register').send({
        email,
        password: 'DifferentPass456!',
      });

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.message).toContain('already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'not-an-email',
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for weak password (too short)', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'Short1!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for password without uppercase', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'lowercasepass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for password without number', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'NoNumbers!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for password without special character', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'NoSpecial123',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app).post('/auth/register').send({
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Email normalization', () => {
    it('should normalize email to lowercase', async () => {
      const response1 = await request(app).post('/auth/register').send({
        email: 'Test@EXAMPLE.com',
        password: 'SecurePass123!',
      });

      expect(response1.status).toBe(201);

      // Try registering same email with different case
      const response2 = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'DifferentPass456!',
      });

      expect(response2.status).toBe(409); // Duplicate
    });

    it('should treat uppercase and lowercase as same email', async () => {
      const response1 = await request(app).post('/auth/register').send({
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123!',
      });

      expect(response1.status).toBe(201);

      // Try registering with lowercase
      const response2 = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'DifferentPass456!',
      });

      expect(response2.status).toBe(409);
    });
  });
});
