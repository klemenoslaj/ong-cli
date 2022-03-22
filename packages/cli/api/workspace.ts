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

import { ProjectType, WorkspaceSchema, WorkspaceTargets } from '@schematics/angular/utility/workspace-models';
import { parse } from 'jsonc-parser';
import { dirname, join } from 'path';
import * as fs from 'fs';

import { CompleteWorkspaceSchema } from '../types';
import { logger } from '../logger';

const { promises: fsAsync } = fs;

const JSONCache: { [name: string]: any } = {};
const filesCache: Record<string, string> = {};

export const appRootPath = pathInner(process.cwd());

function pathInner(dir: string): string {
  if (dir === '/') {
    logger.error("You're not located in Angular workspace.\n");
    process.exit(1);
  }

  if (fileExists(join(dir, 'angular.json'))) {
    return dir;
  }

  return pathInner(dirname(dir));
}

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

const read = {
  json: {
    sync<T extends object>(from: string): T {
      return (JSONCache[from] ??= parse(fs.readFileSync(from, 'utf-8')));
    },
    async async<T extends object>(from: string): Promise<T> {
      return (JSONCache[from] ??= await read.file.async(from).then((r) => parse(r)));
    },
  },
  file: {
    sync(from: string) {
      return (filesCache[from] ??= fs.readFileSync(from, 'utf-8').toString());
    },
    async async(from: string) {
      return (filesCache[from] ??= await fsAsync.readFile(from).then(
        (r) => r.toString(),
        () => '',
      ));
    },
  },
  workspace: {
    sync() {
      return read.json.sync<CompleteWorkspaceSchema>(join(appRootPath, 'angular.json'));
    },
    async async() {
      return read.json.async<CompleteWorkspaceSchema>(join(appRootPath, 'angular.json'));
    },
  },
};

const find = {
  projectRoot: {
    sync() {
      return read.workspace.sync().newProjectRoot ?? 'projects';
    },
    async async() {
      return read.workspace.async().then(({ newProjectRoot }) => newProjectRoot ?? 'projects');
    },
  },
  projects: {
    byType: {
      sync: findProjectByTypeSync,
      async: findProjectByTypeAsync,
    },
  },
  projectNames: {
    every() {
      return Object.keys(workspace.read.workspace.sync().projects);
    },
    byType: {
      sync(projectTypes: readonly ProjectType[]) {
        return findProjectByTypeSync(projectTypes).map(([name]) => name);
      },
      async async(projectTypes: readonly ProjectType[]) {
        return findProjectByTypeAsync(projectTypes).then((projects) => projects.map(([name]) => name));
      },
    },
    supportingTarget: {
      sync: findProjectNamesSupportingTargetSync,
      // async: findProjectNamesSupportingTargetAsync,
    },
  },
};

type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K;
} extends { [_ in keyof T]: infer U }
  ? {} extends U
    ? never
    : U
  : never;

export const workspace = { read, find };

function findProjectNamesSupportingTargetSync(
  target: KnownKeys<WorkspaceTargets> | 'lint',
  projects?: readonly string[],
): readonly string[] {
  // Require angular.json configuration file
  const angularWorkspace = read.workspace.sync();
  return findProjectNamesSupportingTarget(angularWorkspace, target, projects ?? workspace.find.projectNames.every());
}

// async function findProjectNamesSupportingTargetAsync(target: KnownKeys<WorkspaceTargets>): Promise<readonly string[]> {
//   // Require angular.json configuration file
//   const angularWorkspace = await read.workspace.async();
//   return findProjectNamesSupportingTarget(angularWorkspace, target);
// }

function findProjectNamesSupportingTarget(
  angularWorkspace: WorkspaceSchema,
  target: KnownKeys<WorkspaceTargets> | 'lint',
  projects: readonly string[],
) {
  // Get all projects with build configuration
  return Object.entries(angularWorkspace.projects)
    .filter(([name, project]) => !!project.architect?.[target] && projects.includes(name))
    .map(([name]) => name);
}

function findProjectByTypeSync(projectTypes: readonly ProjectType[]) {
  // Require angular.json configuration file
  const angularWorkspace = read.workspace.sync();
  return filterProjectsByType(angularWorkspace, projectTypes);
}

async function findProjectByTypeAsync(projectTypes: readonly ProjectType[]) {
  // Require angular.json configuration file
  const angularWorkspace = await read.workspace.async();
  return filterProjectsByType(angularWorkspace, projectTypes);
}

function filterProjectsByType(angularWorkspace: WorkspaceSchema, projectTypes: readonly ProjectType[]) {
  // Get all projects with build configuration
  const projects = Object.entries(angularWorkspace.projects)
    // Project should be of provided project type
    .filter(([, project]) => projectTypes.includes(project.projectType));

  if (angularWorkspace.defaultProject) {
    const defaultProject = angularWorkspace.projects[angularWorkspace.defaultProject];

    if (defaultProject && projectTypes.includes(defaultProject.projectType)) {
      return [
        <const>[angularWorkspace.defaultProject, defaultProject],
        ...projects.filter(([name]) => name !== angularWorkspace.defaultProject),
      ];
    }
  }

  return projects;
}

// /**
//  * Reads and returns the newProjectRoot from worksapce angular.json
//  */
// export async function getProjectRoot() {
//   return getWorkspaceSchema().then(({ newProjectRoot }) => newProjectRoot ?? 'projects');
// }

// /**
//  * Returns the contents of angular.json file
//  */
// export async function getWorkspaceSchema() {
//   return getJson<CompleteWorkspaceSchema>('./angular.json');
// }

// export async function getJson<T extends object>(from: string): Promise<T> {
//   return (JSONCache[from] ??= await readFile(from).then(r => parse(r)));
// }

// export async function readFile(from: string): Promise<string> {
//   return (filesCache[from] ??= await fs.readFile(from).then(
//     r => r.toString(),
//     () => ''
//   ));
// }

// /**
//  * It will format the provided content using Prettier and return the result.
//  *
//  * @param content the content of file to prettify
//  * @param options prettier options
//  */
// export function prettify(content: string, options: Partial<CursorOptions>) {
//   const defaultOptions = JSON.parse(readFileSync('.prettierrc', 'utf8'));
//   const prettierConfig: CursorOptions = { cursorOffset: 0, ...defaultOptions, ...options };

//   return format(content, prettierConfig);
// }

// /**
//  * It will read the package name of the project from it's package.json file.
//  *
//  * @param shortName library name as found in angular.json `projects`
//  */
// export async function findLibraryName(shortName: string) {
//   const angularJson = await getWorkspaceSchema();
//   const project = angularJson.projects[shortName];

//   if (!project) {
//     console.error('The project does not exist:', shortName);
//     process.exit(1);
//   }

//   return getJson<PackageJSON>(join(project.root, 'package.json')).then(({ name }) => name);
// }

// export async function getProjectsOfTypes(projectTypes: readonly ProjectType[]) {
//   // Require angular.json configuration file
//   const workspace = await getWorkspaceSchema();
//   // Get all projects with build configuration
//   const projects = Object.entries(workspace.projects)
//     // Project should be of provided project type
//     .filter(([_, project]) => projectTypes.includes(project.projectType));

//   if (workspace.defaultProject) {
//     const defaultProject = workspace.projects[workspace.defaultProject];

//     if (defaultProject && projectTypes.includes(defaultProject.projectType)) {
//       return [
//         <const>[workspace.defaultProject, defaultProject],
//         ...projects.filter(([name]) => name !== workspace.defaultProject),
//       ];
//     }
//   }

//   return projects;
// }

// export async function getProjectsNames(projectTypes: readonly ProjectType[]) {
//   return getProjectsOfTypes(projectTypes).then(projects => projects.map(([name]) => name));
// }
