import { lintAffectedProjects } from '../../../api/lint';
import { findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseLintArgs } from './lint-shared';

type Args = Readonly<Parameters<typeof lintAffectedProjects>>;

export const lintAffected: Command<Args> = {
  prompt,
  parseArguments: parseLintArgs,
};

async function prompt(ngArgs: readonly string[]) {
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();

  return {
    execute: lintAffectedProjects,
    commandPrint: findCommandHint({ verbose, parallel, ngArgs, command: Commands.LintAffected }),
    args: <const>[ngArgs, parallel, verbose],
  };
}
