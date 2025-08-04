
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export async function createTask(input: CreateTaskInput, userId: number): Promise<Task> {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        user_id: userId,
        title: input.title,
        description: input.description || null,
        due_date: input.due_date || null,
        completed: false // Default value from schema
      })
      .returning()
      .execute();

    // Return the created task
    const task = result[0];
    return task;
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
}
