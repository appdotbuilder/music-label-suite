
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { trpc } from '@/utils/trpc';
import type { Task } from '../../../server/src/schema';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: number) => void;
}

export function TaskList({ tasks, isLoading, onTaskUpdated, onTaskDeleted }: TaskListProps) {
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const handleToggleComplete = async (task: Task) => {
    try {
      // Note: This will use stub data since handlers are not fully implemented
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      onTaskUpdated(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setDeletingTaskId(taskId);
      // Note: This will use stub data since handlers are not fully implemented
      await trpc.deleteTask.mutate({ id: taskId });
      onTaskDeleted(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setDeletingTaskId(null);
    }
  };

  const formatDueDate = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  const getDueDateVariant = (date: Date | null, completed: boolean) => {
    if (!date || completed) return 'secondary';
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'destructive';
    if (diffDays <= 1) return 'destructive';
    if (diffDays <= 3) return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i: number) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-600">Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task: Task) => (
        <div
          key={task.id}
          className={`border rounded-lg p-4 transition-all hover:shadow-md ${
            task.completed
              ? 'bg-gray-50 border-gray-200 opacity-75'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => handleToggleComplete(task)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`font-medium truncate pr-2 ${
                    task.completed
                      ? 'line-through text-gray-500'
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </h3>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <EditTaskDialog
                    task={task}
                    onTaskUpdated={onTaskUpdated}
                  />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingTaskId === task.id}
                      >
                        🗑️
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{task.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              {task.description && (
                <p className={`text-sm mb-2 ${
                  task.completed ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {task.due_date && (
                    <Badge variant={getDueDateVariant(task.due_date, task.completed)}>
                      📅 {formatDueDate(task.due_date)}
                    </Badge>
                  )}
                  
                  {task.completed && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      ✅ Completed
                    </Badge>
                  )}
                </div>
                
                <span className="text-xs text-gray-400">
                  Created {task.created_at.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
