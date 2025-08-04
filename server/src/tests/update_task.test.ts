
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq, and } from 'drizzle-orm';

describe('updateTask', () => {
  let testUserId: number;
  let testTaskId: number;
  let otherUserId: number;

  beforeEach(async () => {
    await createDB();

    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'hashed_password'
        },
        {
          username: 'otheruser',
          email: 'other@example.com',
          password_hash: 'hashed_password'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test task
    const tasks = await db.insert(tasksTable)
      .values({
        user_id: testUserId,
        title: 'Original Task',
        description: 'Original description',
        due_date: new Date('2024-01-01'),
        completed: false
      })
      .returning()
      .execute();

    testTaskId = tasks[0].id;
  });

  afterEach(resetDB);

  it('should update task title', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(input, testUserId);

    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task description', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      description: 'Updated description'
    };

    const result = await updateTask(input, testUserId);

    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should update task completion status', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      completed: true
    };

    const result = await updateTask(input, testUserId);

    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(true);
  });

  it('should update task due date', async () => {
    const newDueDate = new Date('2024-12-31');
    const input: UpdateTaskInput = {
      id: testTaskId,
      due_date: newDueDate
    };

    const result = await updateTask(input, testUserId);

    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.due_date).toEqual(newDueDate);
  });

  it('should update multiple fields at once', async () => {
    const newDueDate = new Date('2024-06-15');
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Multi-field Update',
      description: 'Updated with multiple fields',
      due_date: newDueDate,
      completed: true
    };

    const result = await updateTask(input, testUserId);

    expect(result.title).toEqual('Multi-field Update');
    expect(result.description).toEqual('Updated with multiple fields');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      description: null,
      due_date: null
    };

    const result = await updateTask(input, testUserId);

    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Database Update Test',
      completed: true
    };

    await updateTask(input, testUserId);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Update Test');
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const input: UpdateTaskInput = {
      id: 99999, // Non-existent task ID
      title: 'Should Fail'
    };

    expect(updateTask(input, testUserId)).rejects.toThrow(/task not found/i);
  });

  it('should throw error when task belongs to different user', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Should Fail'
    };

    expect(updateTask(input, otherUserId)).rejects.toThrow(/task not found/i);
  });

  it('should preserve original created_at timestamp', async () => {
    // Get original created_at
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    const originalCreatedAt = originalTask[0].created_at;

    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Timestamp Test'
    };

    const result = await updateTask(input, testUserId);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at).not.toEqual(originalCreatedAt);
  });
});
