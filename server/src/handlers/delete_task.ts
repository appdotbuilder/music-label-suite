
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteTask(input: DeleteTaskInput, userId: number): Promise<{ success: boolean }> {
  try {
    // Delete the task only if it exists and belongs to the user
    const result = await db.delete(tasksTable)
      .where(
        and(
          eq(tasksTable.id, input.id),
          eq(tasksTable.user_id, userId)
        )
      )
      .execute();

    // Check if any rows were affected (task was found and deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}
