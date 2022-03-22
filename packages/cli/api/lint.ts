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

import { logger } from '../logger';
import { workspace } from './workspace';
import { git } from './git';
import { scheduleParallelTasks } from './task-orchestration/schedule-parallel-tasks';

/**
 * Lints all the projects in Angular workspace in parallel
 *
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function lintCompleteWorkspace(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  const projects = workspace.find.projectNames.supportingTarget.sync('lint');
  return scheduleParallelTasks({
    parallel,
    verbose,
    projects,
    preCalculateGraph: false,
    threadArgs: (project) => ['lint', project, ...ngArgs],
  });
}

/**
 * Lints the provided projects in Angular workspace in parallel
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function lintProjects(
  projects: readonly string[],
  ngArgs: readonly string[],
  parallel: number,
  verbose: boolean,
) {
  const supportedProjects = workspace.find.projectNames.supportingTarget.sync('lint', projects);
  return scheduleParallelTasks({
    parallel,
    verbose,
    projects: supportedProjects,
    preCalculateGraph: false,
    threadArgs: (project) => ['lint', project, ...ngArgs],
  });
}

/**
 * Lints the changed projects on current branch in Angular workspace in parallel
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function lintChangedProjects(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  const changedProjects = git.changedProjects.onBranch();
  if (changedProjects.length === 0) {
    logger.info('No changed projects. Skipping.');
    return 0;
  }

  return lintProjects(changedProjects, ngArgs, parallel, verbose);
}

/**
 * Lints the affected projects on current branch in Angular workspace in parallel.
 * Project is affected if it was directly changed or if the workspace changed.
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function lintAffectedProjects(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  if (git.changedWorkspace.onBranch(['package.json', 'yarn.lock', 'tslint.json', '.prettierrc'])) {
    logger.info('Workspace configuration changed. Linting all projects.');
    return lintCompleteWorkspace(ngArgs, parallel, verbose);
  }

  const changedProjects = git.changedProjects.onBranch();
  if (changedProjects.length === 0) {
    logger.info('No affected projects. Skipping.');
    return 0;
  }

  return lintProjects(changedProjects, ngArgs, parallel, verbose);
}
