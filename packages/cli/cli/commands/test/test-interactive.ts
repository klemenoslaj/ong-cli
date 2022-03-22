import { ProjectType } from '@schematics/angular/utility/workspace-models';

import { workspace } from '../../../api/workspace';
import { testProjects } from '../../../api/test';
import { findInteractiveCommandHint, promptParallel, promptProjects, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseTestArgs } from './test-shared';

type Args = Readonly<Parameters<typeof testProjects>>;

export const testInteractive: Command<Args> = {
  prompt,
  parseArguments: parseTestArgs,
};

async function prompt(ngArgs: readonly string[]) {
  const availableProjects = workspace.find.projectNames.byType.sync([ProjectType.Library, ProjectType.Application]);
  const { projects } = await promptProjects('test', availableProjects);
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();
  const commandPrint = findInteractiveCommandHint({
    projects,
    ngArgs,
    parallel,
    verbose,
    commands: { all: Commands.TestEverything, interactive: Commands.TestInteractive },
    completeAmount: availableProjects.length,
  });

  return {
    commandPrint,
    execute: testProjects,
    args: <const>[projects, [...ngArgs, '--no-watch'], parallel, verbose],
  };
}
