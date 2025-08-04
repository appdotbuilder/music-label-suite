
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword123'
};

// Simple test input
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  due_date: new Date('2024-12-31')
};

describe('createTask', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput, userId);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString()).toEqual('2024-12-31T00:00:00.000Z');
    expect(result.user_id).toEqual(userId);
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields', async () => {
    const minimalInput: CreateTaskInput = {
      title: 'Minimal Task'
    };

    const result = await createTask(minimalInput, userId);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput, userId);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].user_id).toEqual(userId);
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithNullDescription: CreateTaskInput = {
      title: 'Task with null description',
      description: null
    };

    const result = await createTask(inputWithNullDescription, userId);

    expect(result.description).toBeNull();

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].description).toBeNull();
  });

  it('should handle null due_date correctly', async () => {
    const inputWithNullDueDate: CreateTaskInput = {
      title: 'Task with null due date',
      due_date: null
    };

    const result = await createTask(inputWithNullDueDate, userId);

    expect(result.due_date).toBeNull();

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].due_date).toBeNull();
  });
});
