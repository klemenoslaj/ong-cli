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
import { makeGraph } from './graph';
import { workspace } from './workspace';
import { git } from './git';
import { scheduleParallelTasks } from './task-orchestration/schedule-parallel-tasks';

/**
 * Tests all the projects in Angular workspace in parallel
 *
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function testCompleteWorkspace(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  const projects = workspace.find.projectNames.supportingTarget.sync('test' as any);
  return scheduleParallelTasks({
    parallel,
    verbose,
    projects,
    preCalculateGraph: true,
    threadArgs: (project) => ['test', project, ...ngArgs],
  });
}

/**
 * Tests the provided projects in Angular workspace in parallel
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function testProjects(
  projects: readonly string[],
  ngArgs: readonly string[],
  parallel: number,
  verbose: boolean,
) {
  const supportedProjects = workspace.find.projectNames.supportingTarget.sync('test' as any, projects);
  return scheduleParallelTasks({
    parallel,
    verbose,
    projects: supportedProjects,
    preCalculateGraph: true,
    threadArgs: (project) => ['test', project, ...ngArgs],
  });
}

/**
 * Tests the changed projects on current branch in Angular workspace in parallel
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function testChangedProjects(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  const changedProjects = git.changedProjects.onBranch();
  if (changedProjects.length === 0) {
    logger.info('No changed projects. Skipping.');
    return 0;
  }

  return testProjects(changedProjects, ngArgs, parallel, verbose);
}

/**
 * Tests the changed projects on current branch and the projects depending on them in parallel
 * Project is affected if it was changed, if it's dependency changed or if the workspace changed
 *
 * @param projects Projects to build
 * @param ngArgs Arguments that will be passed to Angular CLI `ng` command
 * @param parallel The amount of maximum parallel processes
 */
export async function testAffectedProjects(ngArgs: readonly string[], parallel: number, verbose: boolean) {
  if (git.changedWorkspace.onBranch(['package.json', 'yarn.lock', 'tsconfig.json'])) {
    logger.info('Workspace configuration changed. Testing all projects.');
    return testCompleteWorkspace(ngArgs, parallel, verbose);
  }

  const changedProjects = git.changedProjects.onBranch();
  if (changedProjects.length === 0) {
    logger.info('No affected projects. Skipping.');
    return 0;
  }

  const graph = await makeGraph();
  const projects = graph.dependantsOf(...changedProjects);
  changedProjects.forEach(projects.add, projects);
  return testProjects([...projects], ngArgs, parallel, verbose);
}
