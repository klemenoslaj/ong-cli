/******************************************************************
 * INSTRUCTIONS and NOTES
 *
 * 1. Only `bootstrapCli` should be exported from this file
 ******************************************************************/

import { cyan, dim, yellow, magenta } from 'kleur/colors';
import prompts from 'prompts';

import { logger } from '../logger';
import { question, separator } from './shared';
import {
  Commands,
  buildEverything,
  buildInteractive,
  buildChanged,
  AnyCommand,
  buildEveryLibrary,
  lintEverything,
  lintInteractive,
  testEverything,
  testInteractive,
  lintChanged,
  testChanged,
  buildAffected,
  testAffected,
  debugGraph,
  deployEveryLibrary,
  lintAffected,
} from './commands';

const fullArgv = process.argv.slice(2);
const [commandName, ...argv] = <[keyof typeof commands, ...(readonly string[])]>fullArgv;
const commands: Record<Commands, AnyCommand> = {
  // Build commands
  [Commands.BuildEverything]: buildEverything,
  [Commands.BuildEveryLibrary]: buildEveryLibrary,
  [Commands.BuildInteractive]: buildInteractive,
  [Commands.BuildChanged]: buildChanged,
  [Commands.BuildAffected]: buildAffected,
  // Lint commands
  [Commands.LintEverything]: lintEverything,
  [Commands.LintInteractive]: lintInteractive,
  [Commands.LintChanged]: lintChanged,
  [Commands.LintAffected]: lintAffected,
  // Test commands
  [Commands.TestEverything]: testEverything,
  [Commands.TestInteractive]: testInteractive,
  [Commands.TestChanged]: testChanged,
  [Commands.TestAffected]: testAffected,
  // Deploy commands
  [Commands.DeployEveryLibrary]: deployEveryLibrary,
  // Debug commands
  [Commands.DebugGraph]: debugGraph,
};

export async function bootstrapCli() {
  const { parseArguments, prompt } = commands[commandName] ?? (await promptCommands());
  const { args, commandPrint, execute } = await prompt(findNgArgs(parseArguments));

  logger.info(`Executing: ${cyan(commandPrint.replace(/\s+/g, ' '))}`);
  return execute(...args).then(
    () => process.exit(),
    (error) => {
      logger.error(error);
      process.exit(1);
    },
  );
}

function findNgArgs(parseArguments: AnyCommand['parseArguments']) {
  const parsed = parseArguments(commands[commandName] ? argv : fullArgv);
  prompts.override(parsed);
  return parsed._ as string[];
}

async function promptCommands() {
  interface CommandAnswer {
    readonly command: Commands;
  }

  const { command }: CommandAnswer = await prompts([
    question({
      type: 'select',
      name: 'command',
      message: 'Pick a task',
      choices: [
        separator('Build commands'),
        {
          title: 'Build everything',
          description: 'Builds all the projects',
          value: Commands.BuildEverything,
        },
        {
          title: 'Build all libraries',
          description: 'Builds all the library projects, skipping applications',
          value: Commands.BuildEveryLibrary,
        },
        {
          title: 'Build changed',
          description: 'Builds changed projects on branch',
          value: Commands.BuildChanged,
        },
        {
          title: 'Build affected',
          description: 'Builds the changed projects and the projects depending on them',
          value: Commands.BuildAffected,
        },
        {
          title: 'Build interactive',
          description: 'Builds the selected projects',
          value: Commands.BuildInteractive,
        },
        separator('Lint and format commands'),
        {
          title: 'Lint everything',
          description: 'Lints all the projects',
          value: Commands.LintEverything,
        },
        {
          title: 'Lint changed',
          description: 'Lints the changed projects on branch',
          value: Commands.LintChanged,
        },
        {
          title: 'Lint affected',
          description: 'Lints the changed projects or all the projects if workspace config changed',
          value: Commands.LintChanged,
        },
        {
          title: 'Lint interactive',
          description: 'Lints the selected projects',
          value: Commands.LintInteractive,
        },
        separator('Test commands'),
        {
          title: 'Test everything',
          description: 'Tests all the projects',
          value: Commands.TestEverything,
        },
        {
          title: 'Test changed',
          description: 'Tests the changed projects on branch',
          value: Commands.TestChanged,
        },
        {
          title: 'Test affected',
          description: 'Tests the changed projects and the projects depending on them',
          value: Commands.TestAffected,
        },
        {
          title: 'Test interactive',
          description: 'Tests the selected projects',
          value: Commands.TestInteractive,
        },
        separator('Debug', yellow),
        {
          title: dim('Print graph'),
          description: 'Prints the graph JSON into the terminal',
          value: Commands.DebugGraph,
        },
        separator('Deploy', magenta),
        {
          title: dim('Deploy libraries'),
          description: 'Deploy all the libraries in the workspace',
          value: Commands.DeployEveryLibrary,
        },
      ],
    }),
  ]);

  return commands[command];
}
