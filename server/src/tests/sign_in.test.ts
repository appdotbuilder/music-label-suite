
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignInInput } from '../schema';
import { signIn } from '../handlers/sign_in';

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

const testInput: SignInInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('signIn', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should sign in user with valid credentials', async () => {
    // Create user with hashed password
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: hashedPassword
      })
      .execute();

    const result = await signIn(testInput);

    // Verify user data
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.username).toEqual(testUser.username);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Verify token exists
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);

    // Verify token can be decoded
    const decodedString = Buffer.from(result.token, 'base64').toString('utf-8');
    const decoded = JSON.parse(decodedString);
    expect(decoded.userId).toEqual(result.user.id);
    expect(decoded.email).toEqual(testUser.email);
    expect(decoded.exp).toBeDefined();
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: SignInInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(signIn(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create user with hashed password
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: hashedPassword
      })
      .execute();

    const invalidInput: SignInInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    await expect(signIn(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should return user without password hash', async () => {
    // Create user with hashed password
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: hashedPassword
      })
      .execute();

    const result = await signIn(testInput);

    // Verify password hash is not included in response
    expect((result.user as any).password_hash).toBeUndefined();
  });
});
