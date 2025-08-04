
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignInInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function signIn(input: SignInInput): Promise<AuthResponse> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password (using Bun's built-in password verification)
    const isValidPassword = await Bun.password.verify(input.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate simple token (in production, use proper JWT library)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };
    
    // Simple base64 encoding for demo purposes
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    // Return user data without password hash
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
    console.error('Sign in failed:', error);
    throw error;
  }
}
