import { testChangedProjects } from '../../../api/test';
import { findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseTestArgs } from './test-shared';

type Args = Readonly<Parameters<typeof testChangedProjects>>;

export const testChanged: Command<Args> = {
  prompt,
  parseArguments: parseTestArgs,
};

async function prompt(ngArgs: readonly string[]) {
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();

  return {
    execute: testChangedProjects,
    commandPrint: findCommandHint({ verbose, parallel, ngArgs, command: Commands.TestChanged }),
    args: <const>[[...ngArgs, '--no-watch'], parallel, verbose],
  };
}
