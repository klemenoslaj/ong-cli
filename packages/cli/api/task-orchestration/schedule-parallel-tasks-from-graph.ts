import { red, bold } from 'kleur/colors';

import { makeGraph } from '../graph';
import { makeTasksQueue } from './tasks-queue';
import { makeTaskLogger } from './task-logger';
import type { ThreadMessage } from './model';

const enum VisitFlag {
  Unvisited,
  Visiting,
  Visited,
}

export interface ParallelTasksGraphOptions<T extends readonly string[]> {
  readonly threadArgs: (project: string) => T;
  readonly projects?: readonly string[];
  readonly parallel: number;
  readonly verbose: boolean;
}

/**
 * Schedules the tasks in parallel and ensuring the dependencies
 * are build in a proper sequence before the provided projects are built.
 *
 * @param threadArgs A function providing the arguments passed to Angular CLI `ng` command
 * @param parallel The amount of maximum concurrent processes
 * @param verbose Forces a more verbose output depending on the parallel processes amount
 * @param projects Projects to build
 */
export async function scheduleParallelTasksFromGraph<T extends readonly string[]>({
  threadArgs,
  parallel,
  verbose,
  projects,
}: ParallelTasksGraphOptions<T>) {
  const graph = await makeGraph();
  const dependencies = graph.dependencies();
  const allProjects = Object.keys(dependencies);
  projects ??= allProjects;

  const flags: Record<string, VisitFlag> = {};
  const promises: Record<string, Promise<ThreadMessage>> = {};
  const projectsAmount =
    projects.length === allProjects.length
      ? projects.length
      : new Set([...projects, ...graph.dependenciesOf(...projects)]).size;

  const threads = makeTasksQueue(parallel, projectsAmount, verbose);
  const logger = makeTaskLogger(verbose, parallel);

  return Promise.all(projects.map((project) => visit(project))).then(
    () => (threads.terminate(), logger.finish(), 0),
    (error: ThreadMessage) => {
      logger.fail(error.project, error.output);
      threads.terminate();
      return Promise.reject(error.code);
    },
  );

  async function visit(project: string) {
    const projectDependencies = dependencies[project];

    if (!projectDependencies) {
      throw <ThreadMessage>{ code: 1, project, output: `Missing project in graph: [${bold(red(project))}]` };
    }

    if (flags[project] === VisitFlag.Visited) {
      return promises[project];
    }

    if (flags[project] === VisitFlag.Visiting) {
      throw <ThreadMessage>{ code: 1, project, output: `Circular dependency around step: [${bold(red(project))}]` };
    }

    flags[project] = VisitFlag.Visiting;

    if (projectDependencies.size === 0) {
      // tslint:disable-next-line no-shadowed-variable
      const promise = execute(project);
      flags[project] = VisitFlag.Visited;
      promises[project] = promise;

      return promise;
    }

    const depsPromises: Promise<ThreadMessage>[] = [];

    for (const dependency of projectDependencies) {
      depsPromises.push(visit(dependency));
    }

    const promise = Promise.all(depsPromises).then(() => execute(project));
    flags[project] = VisitFlag.Visited;
    promises[project] = promise;

    return promise;
  }

  async function execute(project: string) {
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
  }
}
