
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type Task } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getTask(input: GetTaskInput, userId: number): Promise<Task> {
  try {
    // Query task by ID and user_id to ensure ownership
    const results = await db.select()
      .from(tasksTable)
      .where(and(
        eq(tasksTable.id, input.id),
        eq(tasksTable.user_id, userId)
      ))
      .execute();

    // Check if task exists
    if (results.length === 0) {
      throw new Error('Task not found or access denied');
    }

    const task = results[0];
    return {
      ...task,
      // Convert timestamp fields to Date objects if needed
      created_at: task.created_at instanceof Date ? task.created_at : new Date(task.created_at),
      updated_at: task.updated_at instanceof Date ? task.updated_at : new Date(task.updated_at),
      due_date: task.due_date ? (task.due_date instanceof Date ? task.due_date : new Date(task.due_date)) : null
    };
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
}
