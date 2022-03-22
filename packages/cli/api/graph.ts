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

import { createSourceFile, isImportDeclaration, Node, ScriptTarget, SyntaxKind } from 'typescript';
import { sync as glob } from 'glob';
import { isAbsolute, join, relative } from 'path';

import { PackageJSON, WorkspacePackageJSON } from '../types';
import { logger } from '../logger';

import { appRootPath, workspace } from './workspace';

export type Graph = Record<string, Set<string>>;
export type GraphArray = Record<string, readonly string[]>;

export interface GraphInstance {
  readonly sequence: {
    full(): readonly string[];
    for(projects: Set<string>): readonly string[];
  };
  complete: {
    dependencies(): Graph;
    dependenciesOf(...projects: readonly string[]): Set<string>;
    dependantsOf(...projects: readonly string[]): Set<string>;
  };
  dependencies(): Graph;
  dependants(): Graph;
  // generatedDependenciesOf(project: string): Set<string>;
  dependenciesOf(...projects: readonly string[]): Set<string>;
  dependantsOf(...projects: readonly string[]): Set<string>;
}

interface Internal {
  readonly completeGraph: Graph;
  readonly depsGraph: Graph;
}

export interface ProcessShare {
  readonly completeGraph: GraphArray;
  readonly depsGraph: GraphArray;
  readonly projectNamePackageNameMap: typeof projectNamePackageNameMap;
  readonly packageNameProjectNameMap: typeof packageNameProjectNameMap;
}

let projectNamePackageNameMap: Record<string, string> = {};
let packageNameProjectNameMap: Record<string, string> = {};
let resolve: (instance: GraphInstance) => void;
let workspaceGraph: Promise<GraphInstance>;
let graphInternal: Internal;

/**
 * Should only be called from the root process to send the already
 * calculated graph down to the child processes, to preserve
 * the expensive I/O opeerations and AST analysis.
 *
 * @internal
 */
export function __wrapForProcessShare__(): ProcessShare {
  return {
    depsGraph: Object.entries(graphInternal.depsGraph).reduce((all, [key, deps]) => {
      all[key] = [...deps];
      return all;
    }, <GraphArray>{}),
    completeGraph: Object.entries(graphInternal.completeGraph).reduce((all, [key, deps]) => {
      all[key] = [...deps];
      return all;
    }, <GraphArray>{}),
    projectNamePackageNameMap,
    packageNameProjectNameMap,
  };
}

/**
 * Should only be called from within the child process to convert the
 * process message compatible graph format to an actual graph containing
 * sets.
 *
 * @internal
 */
export function __unwrapFromProcessShare__(external: ProcessShare) {
  graphInternal = {
    depsGraph: Object.entries(external.depsGraph).reduce((all, [key, deps]) => {
      all[key] = new Set(deps);
      return all;
    }, <Graph>{}),
    completeGraph: Object.entries(external.completeGraph).reduce((all, [key, deps]) => {
      all[key] = new Set(deps);
      return all;
    }, <Graph>{}),
  };
  projectNamePackageNameMap = external.projectNamePackageNameMap;
  packageNameProjectNameMap = external.packageNameProjectNameMap;
}

/**
 * Creates the graph or returns the already calculated graph.
 * It is safe to call the function multiple times in a single process.
 */
export async function makeGraph(): Promise<GraphInstance> {
  if (workspaceGraph) {
    return workspaceGraph;
  }

  workspaceGraph = new Promise((r) => (resolve = r));

  const { depsGraph, completeGraph } = await calculateGraph();
  let dependantsGraph: Graph;
  let sequence: readonly string[];
  const graphInstance = {
    dependencies,
    dependants,
    dependenciesOf,
    dependantsOf,
    // generatedDependenciesOf,
    complete: {
      dependencies: completeDependencies,
      dependenciesOf: completeDependenciesOf,
      dependantsOf: completeDependantsOf,
    },
    sequence: {
      full() {
        return (sequence ??= topsort(dependencies()));
      },
      for(projects: Set<string>) {
        return this.full().filter((project) => projects.has(project));
      },
    },
  };

  resolve(graphInstance);
  return workspaceGraph;

  function dependencies() {
    return depsGraph;
  }

  function dependants() {
    dependantsGraph ??= Object.entries(depsGraph).reduce((graph, [lib, deps]) => {
      graph[lib] ??= new Set();
      for (const dep of deps) {
        graph[dep] ??= new Set();
        graph[dep].add(lib);
      }

      return graph;
    }, <Graph>{});

    return dependantsGraph;
  }

  function dependenciesOf(project: string, ...projects: readonly string[]) {
    return findProjectRelatives(dependencies(), [project, ...projects].filter(Boolean));
  }

  function dependantsOf(project: string, ...projects: readonly string[]) {
    return findProjectRelatives(dependants(), [project, ...projects].filter(Boolean));
  }

  function completeDependencies() {
    return completeGraph;
  }

  function completeDependenciesOf(project: string, ...projects: readonly string[]) {
    return findPackageRelatives(completeDependencies(), [project, ...projects].filter(Boolean));
  }

  function completeDependantsOf(project: string, ...projects: readonly string[]) {
    return findPackageRelatives(completeDependencies(), [project, ...projects].filter(Boolean));
  }
}

function findPackageRelatives(graph: Graph, projects: readonly string[]) {
  const rec = (relatives: Set<string>, acc = new Set<string>()): Set<string> => {
    const deep = new Set<string>();
    let projectName: string;

    for (let packageName of relatives) {
      if ((projectName = packageNameProjectNameMap[packageName]) && !acc.has(packageName)) {
        acc.add(packageName);

        for (packageName of graph[projectName]) {
          deep.add(packageName);
        }
      }
    }

    if (deep.size) {
      return rec(deep, acc);
    }

    return acc;
  };

  if (projects.length === 0) {
    return new Set<string>();
  }

  if (projects.length === 1) {
    return rec(graph[projects[0]]);
  }

  return rec(new Set(projects.map((project) => [...graph[project]]).flat(1)));
}

function findProjectRelatives(graph: Graph, projects: readonly string[]) {
  const rec = (relatives: Set<string>, acc = new Set<string>()): Set<string> => {
    const deep = new Set<string>();

    for (let name of relatives) {
      if (!acc.has(name)) {
        acc.add(name);

        for (name of graph[name]) {
          deep.add(name);
        }
      }
    }

    if (deep.size) {
      return rec(deep, acc);
    }

    return acc;
  };

  if (projects.length === 0) {
    return new Set<string>();
  }

  if (projects.length === 1) {
    return rec(graph[projects[0]]);
  }

  return rec(new Set(projects.map((project) => [...graph[project]]).flat(1)));
}

function topsort(dependencies: Graph): readonly string[] {
  const result: string[] = [];
  const visited: Record<string, true> = {};
  const temp: Record<string, boolean> = {};

  for (const node of Object.keys(dependencies)) {
    if (!visited[node] && !temp[node]) {
      topologicalSortHelper(node);
    }
  }

  return result;

  function topologicalSortHelper(node: string) {
    const neighbors = dependencies[node];

    temp[node] = true;

    for (const neighbour of neighbors) {
      if (temp[neighbour]) {
        throw new Error('The graph is not a DAG');
      }

      if (!visited[neighbour]) {
        topologicalSortHelper(neighbour);
      }
    }

    temp[node] = false;
    visited[node] = true;
    result.push(node);
  }
}

let executedTimes = 0;

async function calculateGraph(): Promise<Internal> {
  if (graphInternal) {
    return graphInternal;
  }

  if (executedTimes++ > 0) {
    throw new Error('Should never be executed multiple times!');
  }

  logger.info('Calculating dependencies graph');

  const [workspaceConfig, workspacePackageJson] = await Promise.all([
    workspace.read.workspace.async(),
    workspace.read.json.async<WorkspacePackageJSON>(join(appRootPath, 'package.json')),
  ]);
  const paths = glob('{{projects,src}/**/!(e2e|stories)/**/!(*.spec|*.po|test).ts,{projects,src}/**/package.json}');
  const files = await readAllFiles(paths);
  const completeGraph: Graph = {};
  const depsGraph: Graph = {};

  const projectEntries = Object.entries(workspaceConfig.projects);

  let path: string;
  let file: string;
  let packageJson: PackageJSON;

  for (let i = 0, projectName = '', root = ''; i < files.length; i++) {
    file = files[i];
    path = paths[i];

    if (pathContainsRoot(path, root)) {
      for ([projectName, { root }] of projectEntries) {
        if (isSubdir(root, path)) {
          completeGraph[projectName] = new Set();
          depsGraph[projectName] = new Set();
          break;
        }
      }
    }

    if (path.endsWith('package.json')) {
      packageJson = JSON.parse(file);

      projectNamePackageNameMap[projectName] = packageJson.name;
      packageNameProjectNameMap[packageJson.name] = projectName;

      continue;
    }
  }

  for (let i = 0, projectName = '', root = '', dependency: string; i < files.length; i++) {
    file = files[i];
    path = paths[i];

    if (pathContainsRoot(path, root)) {
      for ([projectName, { root }] of projectEntries) {
        if (isSubdir(root, path)) {
          break;
        }
      }
    }

    // Check if in package.json there is any package with 0.0.0-PLACEHOLDER referenced as peerDependency.
    // We treat this as an implicit dependency and has to be included to the graph.
    // One such example is if the dependency is not visible trough the TypeScript, such as
    // sass import, you'd need to manually add the dependency to package.json.
    if (path.endsWith('package.json')) {
      packageJson = JSON.parse(file);

      if (!packageJson.peerDependencies) {
        continue;
      }

      for (dependency of Object.keys(packageJson.peerDependencies)) {
        if (packageJson.peerDependencies[dependency] === '0.0.0-PLACEHOLDER') {
          completeGraph[projectName].add(dependency);
          depsGraph[projectName].add(packageNameProjectNameMap[dependency]);
        }
      }

      if (!packageJson.dependencies) {
        continue;
      }

      for (dependency of Object.keys(packageJson.dependencies)) {
        if (packageJson.dependencies[dependency] === '0.0.0-PLACEHOLDER') {
          completeGraph[projectName].add(dependency);
          // Protect against accidental adding of undefined in case the dependency was not found in the initial
          // read of package names. This can happen if the dependency has `0.0.0-PLACEHOLDER` version, but is for
          // some reason handled by different mechanism, such as yarn worksapces.
          // We came across angular repository, having TypeScript typings packages setup as packages in yarn workspace.
          // The build/deploy of such packages we would not like to execute using Angular CLI.
          packageNameProjectNameMap[dependency] && depsGraph[projectName].add(packageNameProjectNameMap[dependency]);
        }
      }

      continue;
    }

    visit(projectName, projectNamePackageNameMap[projectName], createSourceFile(path, file, ScriptTarget.ES2020, true));
  }

  return (graphInternal = { depsGraph, completeGraph });

  function visit(projectName: string, packageName: string, node: Node) {
    for (const child of node.getChildren()) {
      if (isImportDeclaration(child)) {
        if (child.moduleSpecifier) {
          addIfProjectMatches(projectName, packageName, child.moduleSpecifier.getText().slice(1, -1));
        }

        continue;
      }

      if (child.kind === SyntaxKind.ImportKeyword) {
        addIfProjectMatches(projectName, packageName, child.parent.getText().slice(8, -2));
        continue;
      }

      visit(projectName, packageName, child);
    }
  }

  function addIfProjectMatches(projectName: string, packageName: string, moduleSpecifier: string) {
    // Make sure to not include secondary entry points
    moduleSpecifier = moduleSpecifier.split('/').slice(0, 2).join('/');

    if (moduleSpecifier in workspacePackageJson.dependencies) {
      completeGraph[projectName].add(moduleSpecifier);
      return;
    }

    if (moduleSpecifier in packageNameProjectNameMap) {
      if (moduleSpecifier === packageName) {
        return;
      }

      completeGraph[projectName].add(moduleSpecifier);
      depsGraph[projectName].add(packageNameProjectNameMap[moduleSpecifier]);
    }
  }
}

function readAllFiles(paths: readonly string[]): Promise<readonly string[]> {
  const promises: Promise<string>[] = new Array(paths.length);

  for (let i = 0, len = paths.length; i < len; i++) {
    promises[i] = workspace.read.file.async(paths[i]);
  }

  return Promise.all(promises);
}

function isSubdir(parent: string, dir: string) {
  const issubdir = () => rel && !rel.startsWith('..') && !isAbsolute(rel);
  const rel = relative(parent, dir);
  return (parent && issubdir()) || (!parent && dir.startsWith('src'));
}

function pathContainsRoot(path: string, root: string) {
  return !root || !path.startsWith(root + '/');
}
