import prompts from 'prompts';
import parser from 'yargs-parser';

import { coerceParallel, prepareArgsForParsing, question } from '../../shared';

export const enum BuildMode {
  Production = '--configuration production',
  Development = '--configuration development',
}

export interface ProductionAnswer {
  readonly prod: BuildMode;
}

export async function promptProduction(): Promise<ProductionAnswer> {
  return prompts([
    question({
      type: 'confirm',
      name: 'prod',
      initial: true,
      message: 'Are you building for production?',
      format(prev) {
        return prev ? BuildMode.Production : BuildMode.Development;
      },
    }),
  ]);
}

export function coearceParallel(parallel: string | number | undefined | null) {
  return (parallel && Math.max(+parallel || 1, 1)) || 1;
}

export function parseBuildArgs(args: readonly string[]) {
  if (args.length === 0) {
    return { _: [], $0: '' };
  }

  const parsed = parser(<string[]>prepareArgsForParsing(args), {
    number: ['parallel'],
    string: ['configuration'],
    boolean: ['prod', 'verbose'],
    alias: {
      configuration: 'c',
    },
    array: ['projects'],
    default: {
      verbose: false,
    },
    configuration: { 'unknown-options-as-args': true },
  });

  if (parsed.configuration === 'production') {
    parsed.prod = true;
  }

  parsed.parallel = coerceParallel(parsed.parallel);
  return parsed;
}
