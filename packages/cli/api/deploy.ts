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

import { ProjectType } from '@schematics/angular/utility/workspace-models';
import { join } from 'path';

import { buildProjects } from './build';
import { appRootPath, workspace } from './workspace';

// TODO: Use `ng deploy`
export async function deployLibraries(parallel: number, verbose: boolean, dryRun: boolean) {
  const projects = workspace.find.projectNames.byType.sync([ProjectType.Library]);
  return buildProjects(projects, ['--configuration', 'production'], parallel, verbose).then(() =>
    publishOrPackLibraries(dryRun),
  );
}

async function publishOrPackLibraries(dryRun: boolean) {
  const libraries = workspace.find.projectNames.byType.sync([ProjectType.Library]);
  libraries.forEach((lib) => console.log(`${dryRun ? 'Pack' : 'Publish'} from ${join(appRootPath, 'dist', lib)}`));

  return 0;
}
