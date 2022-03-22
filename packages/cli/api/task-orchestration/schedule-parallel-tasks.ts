import { ThreadMessage } from './model';
import { makeTasksQueue } from './tasks-queue';
import { makeTaskLogger } from './task-logger';
import { makeGraph } from '../graph';

export interface ParallelTasksOptions<T extends readonly string[]> {
  readonly threadArgs: (project: string) => T;
  readonly projects: readonly string[];
  readonly parallel: number;
  readonly verbose: boolean;
  readonly preCalculateGraph: boolean;
}

/**
 * Schedules the task tasks in parallel but follows no other agenda.
 * Tasks are scheduled in parallel limited only by the parallel argument.
 *
 * @param threadArgs A function providing the arguments passed to Angular CLI `ng` command
 * @param parallel The amount of maximum concurrent processes
 * @param verbose Forces a more verbose output depending on the parallel processes amount
 * @param projects Projects to build
 * @param preCalculateGraph Usually a good idea to enable if child processes require graph.
 *                          If this is not provided for such processes, each will build an
 *                          own graph.
 */
export async function scheduleParallelTasks<T extends readonly string[]>({
  threadArgs,
  parallel,
  verbose,
  projects,
  preCalculateGraph,
}: ParallelTasksOptions<T>) {
  const logger = makeTaskLogger(verbose, parallel);
  const threads = makeTasksQueue(parallel, projects.length, verbose, false);

  if (preCalculateGraph) {
    await makeGraph();
  }

  return Promise.all(
    projects.map((project) => {
      const args = threadArgs(project);
      const command = `ng ${args.join(' ')}`;

      return threads
        .execute(() => {
          logger.start(command);
          return args;
        })
        .then((result) => {
          logger.complete(command, result.output);
          return result;
        });
    }),
  ).then(
    () => (threads.terminate(), logger.finish(), 0),
    (error: ThreadMessage) => {
      logger.fail(error.project, error.output);
      threads.terminate();
      return Promise.reject(error.code);
    },
  );
}
