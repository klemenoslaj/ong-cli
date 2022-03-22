import { lintCompleteWorkspace } from '../../../api/lint';
import { findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseLintArgs } from './lint-shared';

type Args = Readonly<Parameters<typeof lintCompleteWorkspace>>;

export const lintEverything: Command<Args> = {
  prompt,
  parseArguments: parseLintArgs,
};

async function prompt(ngArgs: readonly string[]) {
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();

  return {
    execute: lintCompleteWorkspace,
    commandPrint: findCommandHint({ verbose, parallel, ngArgs, command: Commands.LintEverything }),
    args: <const>[ngArgs, parallel, verbose],
  };
}
