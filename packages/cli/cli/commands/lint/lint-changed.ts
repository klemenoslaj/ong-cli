import { lintChangedProjects } from '../../../api/lint';
import { findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { parseLintArgs } from './lint-shared';

type Args = Readonly<Parameters<typeof lintChangedProjects>>;

export const lintChanged: Command<Args> = {
  prompt,
  parseArguments: parseLintArgs,
};

async function prompt(ngArgs: readonly string[]) {
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();

  return {
    execute: lintChangedProjects,
    commandPrint: findCommandHint({ verbose, parallel, ngArgs, command: Commands.LintChanged }),
    args: <const>[ngArgs, parallel, verbose],
  };
}
