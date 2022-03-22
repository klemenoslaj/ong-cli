import prompts from 'prompts';

import { question } from '../../shared';

interface DryRunAnswer {
  readonly dryRun: boolean;
}

export async function promptDryrun(): Promise<DryRunAnswer> {
  return prompts([
    question({
      type: 'confirm',
      name: 'dryRun',
      initial: true,
      message: 'Do you wish to run the dry-run? (yarn pack instead of publish)',
    }),
  ]);
}
