
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a task for the authenticated user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'Test Task',
        description: 'A task for testing',
        completed: false
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const input: GetTaskInput = { id: taskId };
    const result = await getTask(input, userId);

    // Verify task details
    expect(result.id).toEqual(taskId);
    expect(result.user_id).toEqual(userId);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.due_date).toBeNull();
  });

  it('should retrieve a task with due date', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test task with due date
    const dueDate = new Date('2024-12-31');
    const taskResult = await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'Task with Due Date',
        description: null,
        due_date: dueDate,
        completed: true
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const input: GetTaskInput = { id: taskId };
    const result = await getTask(input, userId);

    // Verify task details including due date
    expect(result.id).toEqual(taskId);
    expect(result.user_id).toEqual(userId);
    expect(result.title).toEqual('Task with Due Date');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(true);
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.getTime()).toEqual(dueDate.getTime());
  });

  it('should throw error when task does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const input: GetTaskInput = { id: 999 }; // Non-existent task ID

    await expect(getTask(input, userId)).rejects.toThrow(/task not found or access denied/i);
  });

  it('should throw error when task belongs to different user', async () => {
    // Create first user and task
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const user2Id = user2Result[0].id;

    // Create task for user1
    const taskResult = await db.insert(tasksTable)
      .values({
        user_id: user1Id,
        title: 'User 1 Task',
        description: 'Private task',
        completed: false
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const input: GetTaskInput = { id: taskId };

    // Try to access user1's task as user2
    await expect(getTask(input, user2Id)).rejects.toThrow(/task not found or access denied/i);
  });
});
