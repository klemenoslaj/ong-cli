import { ProjectType } from '@schematics/angular/utility/workspace-models';

import { workspace } from '../../../api/workspace';
import { lintProjects } from '../../../api/lint';
import { findInteractiveCommandHint, promptParallel, promptProjects, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseLintArgs } from './lint-shared';

type Args = Readonly<Parameters<typeof lintProjects>>;

export const lintInteractive: Command<Args> = {
  prompt,
  parseArguments: parseLintArgs,
};

async function prompt(ngArgs: readonly string[]) {
  const availableProjects = workspace.find.projectNames.byType.sync([ProjectType.Library, ProjectType.Application]);
  const { projects } = await promptProjects('lint', availableProjects);
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();
  const commandPrint = findInteractiveCommandHint({
    projects,
    ngArgs,
    parallel,
    verbose,
    commands: { all: Commands.LintEverything, interactive: Commands.LintInteractive },
    completeAmount: availableProjects.length,
  });

  return {
    commandPrint,
    execute: lintProjects,
    args: <const>[projects, ngArgs, parallel, verbose],
  };
}
