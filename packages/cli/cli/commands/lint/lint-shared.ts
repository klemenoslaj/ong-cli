import parser from 'yargs-parser';
import { coerceParallel, prepareArgsForParsing } from '../../shared';

export function parseLintArgs(args: readonly string[]) {
  if (args.length === 0) {
    return { _: [], $0: '' };
  }

  const parsed = parser(<string[]>prepareArgsForParsing(args), {
    number: ['parallel'],
    string: ['configuration'],
    boolean: ['verbose'],
    alias: {
      configuration: 'c',
    },
    array: ['projects'],
    default: {
      verbose: false,
    },
    configuration: { 'unknown-options-as-args': true },
  });

  parsed.parallel = coerceParallel(parsed.parallel);
  return parsed;
}
