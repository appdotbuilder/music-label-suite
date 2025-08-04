
import { initTRPC, TRPCError } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  signUpInputSchema, 
  signInInputSchema, 
  createTaskInputSchema, 
  updateTaskInputSchema, 
  deleteTaskInputSchema,
  getTaskInputSchema 
} from './schema';

// Import handlers
import { signUp } from './handlers/sign_up';
import { signIn } from './handlers/sign_in';
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { getTask } from './handlers/get_task';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';

const t = initTRPC.context<{ userId?: number }>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  signUp: publicProcedure
    .input(signUpInputSchema)
    .mutation(({ input }) => signUp(input)),

  signIn: publicProcedure
    .input(signInInputSchema)
    .mutation(({ input }) => signIn(input)),

  // Task management routes (protected)
  createTask: protectedProcedure
    .input(createTaskInputSchema)
    .mutation(({ input, ctx }) => createTask(input, ctx.userId)),

  getTasks: protectedProcedure
    .query(({ ctx }) => getTasks(ctx.userId)),

  getTask: protectedProcedure
    .input(getTaskInputSchema)
    .query(({ input, ctx }) => getTask(input, ctx.userId)),

  updateTask: protectedProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input, ctx }) => updateTask(input, ctx.userId)),

  deleteTask: protectedProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input, ctx }) => deleteTask(input, ctx.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext({ req }) {
      // This is a placeholder context creation! Real implementation should:
      // 1. Extract JWT token from Authorization header
      // 2. Verify and decode the token
      // 3. Return userId from the token payload
      // For now, returning empty context
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
