import { ProjectType } from '@schematics/angular/utility/workspace-models';

import { buildProjects } from '../../../api/build';
import { workspace } from '../../../api/workspace';
import { findInteractiveCommandHint, promptParallel, promptProjects, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseBuildArgs, promptProduction } from './build-shared';

type Args = Readonly<Parameters<typeof buildProjects>>;

export const buildInteractive: Command<Args> = { prompt, parseArguments: parseBuildArgs };

async function prompt(args: readonly string[]) {
  const availableProjects = workspace.find.projectNames.byType.sync([ProjectType.Library, ProjectType.Application]);
  const { projects } = await promptProjects('build', availableProjects);
  const { parallel } = await promptParallel();
  const { prod } = await promptProduction();
  const { verbose } = await promptVerbose();
  const ngArgs = [prod, ...args];
  const commandPrint = findInteractiveCommandHint({
    projects,
    ngArgs,
    parallel,
    verbose,
    commands: { all: Commands.BuildEverything, interactive: Commands.BuildInteractive },
    completeAmount: availableProjects.length,
  });

  return {
    commandPrint,
    execute: buildProjects,
    args: <const>[projects, ngArgs, parallel, verbose],
  };
}
