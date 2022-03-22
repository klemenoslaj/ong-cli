import { testCompleteWorkspace } from '../../../api/test';
import { findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseTestArgs } from './test-shared';

type Args = Readonly<Parameters<typeof testCompleteWorkspace>>;

export const testEverything: Command<Args> = {
  prompt,
  parseArguments: parseTestArgs,
};

async function prompt(ngArgs: readonly string[]) {
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();

  return {
    execute: testCompleteWorkspace,
    commandPrint: findCommandHint({ verbose, parallel, ngArgs, command: Commands.TestEverything }),
    args: <const>[[...ngArgs, '--no-watch'], parallel, verbose],
  };
}
