/******************************************************************
 * INSTRUCTIONS and NOTES
 *
 * Only export **public** members!
 * Do the following to export internals:
 * - export internals from this file
 * - create folder next to this file with the same name
 * - move this file in that folder
 * - create index.ts in that folder
 * - export public members from index
 *
 * For internal usage the file should be imported.
 * For public usage the folder should be imported -> index.ts.
 ******************************************************************/

import { join } from 'path';
import { rmdirSync } from 'fs';

import { logger } from '../logger';
import { git } from './git';
import { appRootPath } from './workspace';
import { scheduleParallelTasksFromGraph } from './task-orchestration';
import { makeGraph } from './graph';

/**
 * Builds all the projects in Angular workspace in parallel and in the correct sequence
 *
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function buildCompleteWorkspace(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  rmdirSync(join(appRootPath, 'dist'), { recursive: true });
  return scheduleParallelTasksFromGraph({
    parallel,
    verbose,
    threadArgs: (project) => ['build', project, ...ngArgs],
  });
}

/**
 * Builds the provided projects in Angular workspace in parallel and in the correct sequence
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function buildProjects(
  projects: readonly string[],
  ngArgs: readonly string[],
  parallel: number,
  verbose: boolean,
) {
  rmdirSync(join(appRootPath, 'dist'), { recursive: true });
  return scheduleParallelTasksFromGraph({
    parallel,
    verbose,
    projects,
    threadArgs: (project) => ['build', project, ...ngArgs],
  });
}

/**
 * Builds the changed projects on current branch in Angular workspace in parallel and in the correct sequence
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function buildChangedProjects(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  const changedProjects = git.changedProjects.onBranch();
  if (changedProjects.length === 0) {
    logger.info('No changed projects. Skipping.');
    return 0;
  }

  return buildProjects(changedProjects, ngArgs, parallel, verbose);
}

/**
 * Builds the changed projects on current branch and the projects depending on them in parallel and
 * in the correct sequence
 * Project is affected if it was changed, if it's dependency changed or if the workspace changed
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function buildAffectedProjects(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  if (git.changedWorkspace.onBranch(['package.json', 'tsconfig.json', 'yarn.lock', 'Jenkinsfile'])) {
    logger.info('Workspace configuration changed. Building all projects.');
    return buildCompleteWorkspace(ngArgs, parallel, verbose);
  }

  const changedProjects = git.changedProjects.onBranch();
  if (changedProjects.length === 0) {
    logger.info('No affected projects. Skipping.');
    return 0;
  }
  const graph = await makeGraph();
  const projects = graph.dependantsOf(...changedProjects);
  changedProjects.forEach(projects.add, projects);
  return buildProjects([...projects], ngArgs, parallel, verbose);
}
