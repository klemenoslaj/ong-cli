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

import { execSync } from 'child_process';

import { workspace } from './workspace';

enum FilesIncludeFilter {
  Added = 'A',
  Copied = 'C',
  Deleted = 'D',
  Modified = 'M',
  Renamed = 'R',
  TypeChanged = 'T',
  Unmerged = 'U',
  Unknown = 'X',
  PairingBroke = 'B',
}

enum FilesExcludeFilter {
  Added = 'a',
  Copied = 'c',
  Deleted = 'd',
  Modified = 'm',
  Renamed = 'r',
  TypeChanged = 't',
  Unmerged = 'u',
  Unknown = 'x',
  PairingBroke = 'b',
}

const gitCache = <const>{
  staged: <Record<string, readonly string[]>>{},
  branch: <Record<string, readonly string[]>>{},
  commit: <{ [key: string]: Record<string, readonly string[]> }>{},
};

export const git = {
  changedFiles: {
    onBranch: getChangedFilesOnBranch,
    onCommit: getChangedFilesOnCommit,
  },
  changedProjects: {
    onBranch: getChangedProjectsOnBranch,
    onCommit: getChangedProjectsOnCommit,
  },
  changedWorkspace: {
    onBranch: workspaceChanged,
  },
};

function getChangedFilesOnBranch(...diffFilters: readonly (FilesExcludeFilter | FilesIncludeFilter)[]) {
  const filters = diffFilters.join('');

  if (gitCache.branch[filters]) {
    return gitCache.branch[filters];
  }

  const filtersArgs = filters.length ? `--diff-filter=${filters}` : '';
  const shellCommand =
    `git diff --name-only ${filtersArgs} $(git merge-base ${getBaseBranch()} $(git rev-parse --abbrev-ref HEAD))`.trim();

  return (gitCache.branch[filters] = execSilent(shellCommand).toString().trim().split('\n'));
}

function execSilent(command: string) {
  return execSync(command, { stdio: ['pipe', 'pipe', 'ignore'] });
}

function getChangedFilesOnCommit(commit: string = '', ...diffFilters: (FilesExcludeFilter | FilesIncludeFilter)[]) {
  const filters = diffFilters.join('');

  if (gitCache.commit[commit]?.[filters]) {
    return gitCache.commit[commit][filters];
  }

  const filtersArgs = filters.length ? ` --diff-filter=${filters}` : '';
  const commitHashArg = commit ? ` ${commit}` : '';
  const shellCommand = 'git show --name-only --oneline' + commitHashArg + filtersArgs;
  const result = execSilent(shellCommand).toString().trim().split('\n');

  gitCache.commit[commit] = gitCache.commit[commit] ?? {};
  gitCache.commit[commit][filters] = result;

  return result;
}

function getChangedProjectsOnBranch() {
  return getChanedProjectsFromFiles(getChangedFilesOnBranch());
}

function getChangedProjectsOnCommit(commit?: string) {
  return getChanedProjectsFromFiles(getChangedFilesOnCommit(commit));
}

// function getStagedFiles(...diffFilters: readonly (FilesExcludeFilter | FilesIncludeFilter)[]) {
//   // git diff --name-only --cached
//   const filters = diffFilters.join('');

//   if (gitCache.staged[filters]) {
//     return gitCache.staged[filters];
//   }

//   const filtersArgs = filters.length ? ` --diff-filter=${filters}` : '';
//   const shellCommand = 'git diff --name-only --cached' + filtersArgs;

//   return (gitCache.staged[filters] = shell.exec(shellCommand, { silent: true }).toString().trim().split('\n'));
// }

// // function getChangedProjectsInStage() {
// //   return getChanedProjectsFromFiles(getStagedFiles());
// // }

function workspaceChanged(configFiles: readonly string[]) {
  const files = getChangedFilesOnBranch();

  return files.some((file) => configFiles.includes(file));
}

function getChanedProjectsFromFiles(files: readonly string[]) {
  const newProjectRoot = workspace.find.projectRoot.sync();
  return [...new Set(files.filter((file) => file.startsWith(newProjectRoot)).map((file) => file.split('/')[1]))];
}

// // function getCommitsBetween(fromHash: string, toHash?: string) {
// //   return shell
// //     .exec(`git log --pretty=oneline ${fromHash}...${toHash ?? 'HEAD'}`, { silent: true })
// //     .toString()
// //     .trim()
// //     .split('\n')
// //     .filter(Boolean);
// // }

// // let lastMasterCommit: string;
// // function getLastMasterCommit() {
// //   if (lastMasterCommit) {
// //     return lastMasterCommit;
// //   }

// //   const shellCommand = `git merge-base ${getBaseBranch()} $(git rev-parse --abbrev-ref HEAD)`;

// //   return (lastMasterCommit = shell.exec(shellCommand, { silent: true }).toString().slice(0, -1));
// // }

let baseBranch: string;
function getBaseBranch() {
  if (baseBranch) {
    return baseBranch;
  }

  const amount = process.env.ONG_CLI_COMMITS_AMOUNT ? +process.env.ONG_CLI_COMMITS_AMOUNT : 200;
  const remote = execSilent('git remote').toString().trim();
  const commits = execSilent(`git log -n ${amount} --pretty=format:"%h"`).toString().split('\n');

  // TODO: Long term this should become configurable
  const master = `${remote}/master`;
  const next = `${remote}/next`;

  for (const commit of commits) {
    const branches = execSilent(`git branch -a --contains ${commit}`).toString();

    if (branches.includes(master)) {
      return (baseBranch = master);
    }

    if (branches.includes(next)) {
      return (baseBranch = next);
    }
  }

  return master;
}
