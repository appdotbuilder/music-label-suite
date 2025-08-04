
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no tasks', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const tasks = await getTasks(userId);

    expect(tasks).toEqual([]);
  });

  it('should return all tasks for a user ordered by creation date', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple tasks with slight delays to ensure different timestamps
    const task1 = await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'First Task',
        description: 'First task description',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const task2 = await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'Second Task',
        description: 'Second task description',
        due_date: new Date('2024-12-31'),
        completed: true
      })
      .returning()
      .execute();

    const tasks = await getTasks(userId);

    expect(tasks).toHaveLength(2);
    
    // Should be ordered by created_at descending (newest first)
    expect(tasks[0].title).toEqual('Second Task');
    expect(tasks[0].description).toEqual('Second task description');
    expect(tasks[0].due_date).toBeInstanceOf(Date);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[0].user_id).toEqual(userId);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);

    expect(tasks[1].title).toEqual('First Task');
    expect(tasks[1].description).toEqual('First task description');
    expect(tasks[1].due_date).toBeNull();
    expect(tasks[1].completed).toBe(false);
    expect(tasks[1].user_id).toEqual(userId);
    expect(tasks[1].created_at).toBeInstanceOf(Date);
    expect(tasks[1].updated_at).toBeInstanceOf(Date);
  });

  it('should only return tasks for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create tasks for both users
    await db.insert(tasksTable)
      .values({
        user_id: user1Id,
        title: 'User 1 Task',
        completed: false
      })
      .execute();

    await db.insert(tasksTable)
      .values({
        user_id: user2Id,
        title: 'User 2 Task',
        completed: false
      })
      .execute();

    // Get tasks for user 1
    const user1Tasks = await getTasks(user1Id);
    expect(user1Tasks).toHaveLength(1);
    expect(user1Tasks[0].title).toEqual('User 1 Task');
    expect(user1Tasks[0].user_id).toEqual(user1Id);

    // Get tasks for user 2
    const user2Tasks = await getTasks(user2Id);
    expect(user2Tasks).toHaveLength(1);
    expect(user2Tasks[0].title).toEqual('User 2 Task');
    expect(user2Tasks[0].user_id).toEqual(user2Id);
  });

  it('should handle tasks with null description and due_date', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create task with minimal required fields
    await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'Minimal Task',
        completed: false
      })
      .execute();

    const tasks = await getTasks(userId);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Minimal Task');
    expect(tasks[0].description).toBeNull();
    expect(tasks[0].due_date).toBeNull();
    expect(tasks[0].completed).toBe(false);
  });
});
