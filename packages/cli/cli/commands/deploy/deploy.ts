import parser from 'yargs-parser';

import { logger } from '../../../logger';
import { deployLibraries } from '../../../api/deploy';
import { coerceParallel, findCommandHint, promptParallel, promptVerbose } from '../../shared';
import { Commands } from '../commands';
import { Command } from '../model';
import { promptDryrun } from './deploy-shared';

type Args = Readonly<Parameters<typeof deployLibraries>>;

export const deployEveryLibrary: Command<Args> = {
  prompt,
  parseArguments: parseDeployArguments,
};

async function prompt() {
  logger.info('Before the deployment, we need to build libraries');
  const { parallel } = await promptParallel();
  const { verbose } = await promptVerbose();
  const { dryRun } = await promptDryrun();

  return {
    execute: deployLibraries,
    commandPrint: findCommandHint({
      verbose,
      parallel,
      dryRun,
      ngArgs: [],
      command: Commands.DeployEveryLibrary,
    }),
    args: <const>[parallel, verbose, dryRun],
  };
}

export function parseDeployArguments(args: readonly string[]) {
  if (args.length === 0) {
    return { _: [], $0: '' };
  }

  const parsed = parser(<string[]>args, {
    number: ['parallel'],
    boolean: ['verbose', 'dry-run'],
    default: {
      verbose: false,
    },
    configuration: { 'unknown-options-as-args': true },
  });

  parsed.parallel = coerceParallel(parsed.parallel);
  return parsed;
}
