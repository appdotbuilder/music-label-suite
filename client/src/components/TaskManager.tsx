
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { trpc } from '@/utils/trpc';
import type { PublicUser, Task } from '../../../server/src/schema';

interface TaskManagerProps {
  user: PublicUser;
  onLogout: () => void;
}

export function TaskManager({ user, onLogout }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      // Note: This will use stub data since handlers are not fully implemented
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskCreated = useCallback((newTask: Task) => {
    setTasks((prev: Task[]) => [newTask, ...prev]);
  }, []);

  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    setTasks((prev: Task[]) =>
      prev.map((task: Task) => task.id === updatedTask.id ? updatedTask : task)
    );
  }, []);

  const handleTaskDeleted = useCallback((taskId: number) => {
    setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
  }, []);

  const filteredTasks = tasks.filter((task: Task) => {
    switch (activeTab) {
      case 'active':
        return !task.completed;
      case 'completed':
        return task.completed;
      case 'overdue':
        return !task.completed && task.due_date && new Date(task.due_date) < new Date();
      default:
        return true;
    }
  });

  const taskStats = {
    total: tasks.length,
    active: tasks.filter((task: Task) => !task.completed).length,
    completed: tasks.filter((task: Task) => task.completed).length,
    overdue: tasks.filter((task: Task) => 
      !task.completed && task.due_date && new Date(task.due_date) < new Date()
    ).length
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.username}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your tasks and stay productive
            </p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{taskStats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Task Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✨ Create New Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskForm onTaskCreated={handleTaskCreated} />
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    📋 Your Tasks
                  </span>
                  <Badge variant="secondary">
                    {filteredTasks.length} tasks
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Done</TabsTrigger>
                    <TabsTrigger value="overdue">Overdue</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <TaskList 
                      tasks={filteredTasks}
                      isLoading={isLoading}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskDeleted={handleTaskDeleted}
                    />
                  </TabsContent>
                  <TabsContent value="active">
                    <TaskList 
                      tasks={filteredTasks}
                      isLoading={isLoading}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskDeleted={handleTaskDeleted}
                    />
                  </TabsContent>
                  <TabsContent value="completed">
                    <TaskList 
                      tasks={filteredTasks}
                      isLoading={isLoading}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskDeleted={handleTaskDeleted}
                    />
                  </TabsContent>
                  <TabsContent value="overdue">
                    <TaskList 
                      tasks={filteredTasks}
                      isLoading={isLoading}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskDeleted={handleTaskDeleted}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
