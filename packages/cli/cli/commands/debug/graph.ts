import prompts from 'prompts';
import parser from 'yargs-parser';
import { yellow } from 'kleur/colors';

import { makeGraph } from '../../../api/graph';
import { logger } from '../../../logger';
import { Commands } from '../commands';
import { Command } from '../model';
import { awaitable } from '../../../api/helpers';

type Args = readonly string[];

export const debugGraph: Command<Args> = {
  prompt,
  parseArguments,
};

interface GraphAnswer {
  readonly direction: Direction;
}

const enum Direction {
  Dependants = 'dependants',
  Dependencies = 'dependencies',
  CompleteDependencies = 'completeDependencies',
}

async function prompt() {
  const { direction } = await promptDirection();

  return {
    async execute() {
      const [error, graph] = await awaitable(makeGraph());

      if (error) {
        throw error;
      }

      if (direction === Direction.CompleteDependencies) {
        // tslint:disable-next-line no-non-null-assertion
        console.log(JSON.parse(JSON.stringify(graph!.complete.dependencies(), convertSetToArray)));
      } else {
        // tslint:disable-next-line no-non-null-assertion
        console.log(JSON.parse(JSON.stringify(graph![direction](), convertSetToArray)));
      }

      return 0;
    },
    commandPrint: `ong ${Commands.DebugGraph} --direction ${direction}`,
    args: <Args>[],
  };
}

function convertSetToArray(_: string, value: Set<string>) {
  if (value instanceof Set) {
    return [...value].sort();
  }

  return value;
}

function parseArguments(args: Args) {
  const parsed = parser(<string[]>args, {
    string: ['direction'],
  });

  if (
    parsed.direction &&
    parsed.direction !== Direction.Dependants &&
    parsed.direction !== Direction.Dependencies &&
    parsed.direction !== Direction.CompleteDependencies
  ) {
    logger.error(`Please provide ${yellow(Direction.Dependencies)} or ${yellow(Direction.Dependants)} direction`);
    process.exit(1);
  }

  return parsed;
}

async function promptDirection(): Promise<GraphAnswer> {
  return prompts([
    {
      type: 'select',
      name: 'direction',
      message: 'Which direction?',
      choices: [
        {
          title: 'Dependencies',
          value: Direction.Dependencies,
        },
        {
          title: 'Dependants',
          value: Direction.Dependants,
        },
        {
          title: 'Complete dependencies',
          value: Direction.CompleteDependencies,
        },
      ],
    },
  ]);
}
