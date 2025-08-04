
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignUpInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  try {
    // Check if username already exists
    const existingUsername = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .limit(1)
      .execute();

    if (existingUsername.length > 0) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .execute();

    if (existingEmail.length > 0) {
      throw new Error('Email already exists');
    }

    // Hash password (using Bun's built-in crypto)
    const passwordHash = await Bun.password.hash(input.password);

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    const user = result[0];

    // Generate JWT token (simplified for this implementation)
    const token = await Bun.password.hash(`${user.id}:${user.email}:${Date.now()}`);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('User sign up failed:', error);
    throw error;
  }
}
