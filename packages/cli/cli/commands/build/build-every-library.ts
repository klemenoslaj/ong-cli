import { ProjectType } from '@schematics/angular/utility/workspace-models';

import { buildProjects } from '../../../api/build';
import { workspace } from '../../../api/workspace';
import { findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseBuildArgs, promptProduction } from './build-shared';

type Args = Readonly<Parameters<typeof buildProjects>>;

export const buildEveryLibrary: Command<Args> = {
  prompt,
  parseArguments: parseBuildArgs,
};

async function prompt(args: readonly string[]) {
  const projects = workspace.find.projectNames.byType.sync([ProjectType.Library]);
  const { parallel } = await promptParallel();
  const { prod } = await promptProduction();
  const { verbose } = await promptVerbose();
  const ngArgs = [prod, ...args];

  return {
    execute: buildProjects,
    commandPrint: findCommandHint({ verbose, parallel, ngArgs, command: Commands.BuildEveryLibrary }),
    args: <const>[projects, ngArgs, parallel, verbose],
  };
}
