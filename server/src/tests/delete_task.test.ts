
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task that belongs to the user', async () => {
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
        description: 'A task to be deleted',
        completed: false
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    const input: DeleteTaskInput = {
      id: taskId
    };

    const result = await deleteTask(input, userId);

    expect(result.success).toBe(true);

    // Verify task was deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when task does not exist', async () => {
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

    const input: DeleteTaskInput = {
      id: 999999 // Non-existent task ID
    };

    const result = await deleteTask(input, userId);

    expect(result.success).toBe(false);
  });

  it('should return false when task belongs to different user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create task for user1
    const taskResult = await db.insert(tasksTable)
      .values({
        user_id: user1Id,
        title: 'User1 Task',
        description: 'This belongs to user1',
        completed: false
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    const input: DeleteTaskInput = {
      id: taskId
    };

    // Try to delete user1's task as user2
    const result = await deleteTask(input, user2Id);

    expect(result.success).toBe(false);

    // Verify task still exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('User1 Task');
    expect(tasks[0].user_id).toEqual(user1Id);
  });

  it('should not affect other tasks when deleting specific task', async () => {
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

    // Create multiple test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'Task 1',
        description: 'First task',
        completed: false
      })
      .returning()
      .execute();
    const task1Id = task1Result[0].id;

    const task2Result = await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: 'Task 2',
        description: 'Second task',
        completed: true
      })
      .returning()
      .execute();
    const task2Id = task2Result[0].id;

    const input: DeleteTaskInput = {
      id: task1Id
    };

    const result = await deleteTask(input, userId);

    expect(result.success).toBe(true);

    // Verify only the specified task was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.user_id, userId))
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toEqual(task2Id);
    expect(remainingTasks[0].title).toEqual('Task 2');
  });
});
