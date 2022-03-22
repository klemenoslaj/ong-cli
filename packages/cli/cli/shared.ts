import { cpus } from 'os';
import prompts, { Choice, PromptObject } from 'prompts';
import { dim, underline, grey, reset } from 'kleur/colors';

import { terminal } from '../logger';
import { Commands } from './commands';
import { logger } from '../logger';

export interface ProjectsAnswer {
  readonly projects: readonly string[];
}

export interface ParallelAnswer {
  readonly parallel: number;
}

export interface VerboseAnswer {
  readonly verbose: boolean;
}

export type PossibleActions = 'build' | 'lint' | 'test';

export async function promptProjects(action: PossibleActions, projects: readonly string[]): Promise<ProjectsAnswer> {
  return prompts([
    question({
      type: 'autocompleteMultiselect',
      name: 'projects',
      message: `Pick projects to ${action}`,
      min: 1,
      choices: projects.map((project) => ({
        title: project,
        value: project,
      })),
    }),
  ]);
}

const coreCount = cpus().length;
const hasStdin = Boolean(process.stdin.isTTY);

export async function promptParallel(): Promise<ParallelAnswer> {
  return prompts([
    question({
      type: 'number',
      name: 'parallel',
      message: 'How many parallel processes?',
      min: 1,
      validate(value: number) {
        if (value < 1 || value > coreCount) {
          const message = `Please provide a number between 1 and ${coreCount} (CPU core count)`;
          if (!hasStdin) {
            logger.error(message);
            process.exit(1);
          }

          return message;
        }

        return true;
      },
    }),
  ]);
}

export function coerceParallel(parallel: number) {
  if (hasStdin) {
    return parallel;
  }

  if (parallel < 1) {
    return 1;
  }

  if (parallel > coreCount) {
    logger.warn(`The desired ${parallel} parallel processes are reduced to the amount of CPU cores: ${coreCount}.`);
    return coreCount;
  }

  return parallel;
}

export async function promptVerbose(): Promise<VerboseAnswer> {
  return prompts([
    question({
      type: 'confirm',
      name: 'verbose',
      initial: false,
      message: 'Do you wish to see the output of commands? (verbose)',
    }),
  ]);
}

export function separator(title: string, color = grey): Choice {
  title = `${title}${' ---------'.substr(0, 12)}`;
  title = color === grey ? grey(title) : color(dim(title));
  title = reset(underline(title));

  return {
    title,
    value: null,
    disabled: true,
  };
}

interface PromptState {
  readonly aborted: boolean;
}

function onState(state: PromptState) {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    terminal.restoreCursor();
    process.stdout.write('\n');
    process.exit(1);
  }
}

export function question<T extends PromptObject>(prompt: T): T {
  return <T>{
    ...prompt,
    onState(...args: Parameters<NonNullable<PromptObject['onState']>>) {
      onState(args[0]);
      prompt.onState?.(...args);
    },
  };
}

export function findInteractiveCommandHint({
  verbose,
  projects,
  completeAmount,
  ngArgs,
  parallel,
  commands,
  dryRun,
}: {
  readonly completeAmount: number;
  readonly dryRun?: boolean;
  readonly parallel: number;
  readonly verbose: boolean;
  readonly ngArgs: readonly string[];
  readonly projects: readonly string[];
  readonly commands: {
    readonly all: Commands;
    readonly interactive: Commands;
  };
}) {
  if (projects.length === completeAmount) {
    return findCommandHint({ verbose, ngArgs, parallel, dryRun, command: commands.all });
  }

  return findCommandHint({ verbose, projects, ngArgs, parallel, dryRun, command: commands.interactive });
}

export function findCommandHint({
  verbose,
  dryRun = false,
  projects = [],
  ngArgs,
  parallel,
  command,
}: {
  readonly verbose: boolean;
  readonly dryRun?: boolean;
  readonly projects?: readonly string[];
  readonly ngArgs: readonly string[];
  readonly parallel: number;
  readonly command: Commands;
}) {
  const verboseFlag = flag(verbose, '--verbose');
  const dryRunFlag = flag(dryRun, '--dry-run');
  const args = ngArgs.join(' ');

  return `ong ${command} ${projects.join(' ')} ${args} --parallel ${parallel}${verboseFlag}${dryRunFlag}`;
}

function flag(hasFlag: boolean, flagArg: string) {
  return hasFlag ? ' ' + flagArg : '';
}

export function prepareArgsForParsing(args: readonly string[]) {
  const flagIndex = args.findIndex((arg) => arg.startsWith('-'));
  const projects = flagIndex > -1 ? args.slice(0, flagIndex) : args;
  const flags = flagIndex > -1 ? args.slice(flagIndex) : [];
  const projectsFlag = projects.length ? ['--projects', ...projects] : [];

  return [...flags, ...projectsFlag];
}
