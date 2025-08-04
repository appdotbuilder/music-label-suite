
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignUpInput } from '../schema';
import { signUp } from '../handlers/sign_up';
import { eq } from 'drizzle-orm';

const testInput: SignUpInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

describe('signUp', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user successfully', async () => {
    const result = await signUp(testInput);

    // Validate response structure
    expect(result.user.username).toEqual('testuser');
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('should save user to database with hashed password', async () => {
    const result = await signUp(testInput);

    // Query database to verify user was created
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].password_hash).not.toEqual('password123'); // Password should be hashed
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await signUp(testInput);

    // Attempt to create user with same username but different email
    const duplicateUsernameInput: SignUpInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'password456'
    };

    await expect(signUp(duplicateUsernameInput)).rejects.toThrow(/username already exists/i);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await signUp(testInput);

    // Attempt to create user with same email but different username
    const duplicateEmailInput: SignUpInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'password456'
    };

    await expect(signUp(duplicateEmailInput)).rejects.toThrow(/email already exists/i);
  });

  it('should verify password is properly hashed', async () => {
    const result = await signUp(testInput);

    // Get the user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    const storedUser = users[0];

    // Verify password can be verified with Bun's password verification
    const isValid = await Bun.password.verify('password123', storedUser.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', storedUser.password_hash);
    expect(isInvalid).toBe(false);
  });
});
