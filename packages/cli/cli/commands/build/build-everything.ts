import { buildCompleteWorkspace } from '../../../api/build';
import { findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseBuildArgs, promptProduction } from './build-shared';

type Args = Readonly<Parameters<typeof buildCompleteWorkspace>>;

export const buildEverything: Command<Args> = {
  prompt,
  parseArguments: parseBuildArgs,
};

async function prompt(args: readonly string[]) {
  const { parallel } = await promptParallel();
  const { prod } = await promptProduction();
  const { verbose } = await promptVerbose();
  const ngArgs = [prod, ...args];

  return {
    execute: buildCompleteWorkspace,
    commandPrint: findCommandHint({ verbose, parallel, ngArgs, command: Commands.BuildEverything }),
    args: <const>[ngArgs, parallel, verbose],
  };
}
