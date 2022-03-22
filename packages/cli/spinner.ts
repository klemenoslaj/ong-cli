/******************************************************************
 * INSTRUCTIONS and NOTES
 *
 * Only export **public** members!
 * Do the following to export internals:
 * - export internals from this file
 * - create folder next to this file with the same name
 * - move this file in that folder
 * - create index.ts in that folder
 * - export public members from index
 *
 * For internal usage the file should be imported.
 * For public usage the folder should be imported -> index.ts.
 ******************************************************************/

import { cyan, red, bold, gray } from 'kleur/colors';
import ora from 'ora';

import { logger, terminal } from './logger';

export const prebuiltSpinners = {
  default: makeProgressiveSpinner,
  immediate: makeImmediateLogger,
  delayed: makeDelayedLogger,
  accumulative: makeAccumulativeSpinner,
};

function onDone(start: Date) {
  logger.info(`Execution took ${((new Date().getTime() - start.getTime()) / 1000).toFixed(2)}s`);
}

function makeImmediateLogger() {
  const delimiterSize = process.stdout.columns || 100;
  const groupDelimiter = '='.repeat(delimiterSize);
  const start = new Date();
  terminal.removeCursor();

  process.on('SIGINT', function () {
    terminal.restoreCursor();
  });
  process.on('SIGTERM', function () {
    terminal.restoreCursor();
  });

  return {
    start(uniqueMessage: string) {
      terminal.removeCursor();
      logger.log(`\n${groupDelimiter}\n${uniqueMessage}\n${groupDelimiter}\n`);
    },
    complete(_uniqueMessage: string, _output: string) {
      terminal.removeCursor();
    },
    finish() {
      terminal.restoreCursor();
      logger.success('All commands got executed');
      onDone(start);
    },
    fail(project: string, _output: string) {
      terminal.restoreCursor();
      logger.error(`Project ${red(bold(project))} failed\n`);
      onDone(start);
    },
    info(message: string) {
      logger.info(message);
    },
  };
}

function makeDelayedLogger() {
  const delimiterSize = process.stdout.columns || 100;
  const groupDelimiter = '='.repeat(delimiterSize);
  const makeMessage = () => cyan(bold('Running')) + gray('\n- ' + inProgress.join('\n- '));
  const spinner = ora();
  const start = new Date();
  let inProgress: string[] = [];

  return {
    start(uniqueMessage: string) {
      inProgress = [...inProgress, uniqueMessage];
      spinner.start(makeMessage());
    },
    complete(uniqueMessage: string, output: string) {
      inProgress = inProgress.filter((p) => p !== uniqueMessage);
      spinner.text = makeMessage();
      spinner.stop();
      logger.log(`\n${groupDelimiter}\n${uniqueMessage}\n${groupDelimiter}\n`);
      logger.log(output);
      spinner.start();
    },
    finish() {
      spinner.succeed('All commands got executed');
      onDone(start);
    },
    fail(project: string, output: string) {
      spinner.fail(`Project ${red(bold(project))} failed\n`);
      logger.log(output);
      onDone(start);
    },
    info(message: string) {
      spinner.stop();
      logger.info(message);
      spinner.start();
    },
  };
}

function makeProgressiveSpinner() {
  const makeMessage = () => cyan(bold('Running')) + gray('\n- ' + inProgress.join('\n- '));
  const spinner = ora();
  const start = new Date();
  let inProgress: string[] = [];

  return {
    start(uniqueMessage: string) {
      inProgress = [...inProgress, uniqueMessage];
      spinner.start(makeMessage());
    },
    complete(uniqueMessage: string, _output: string) {
      inProgress = inProgress.filter((p) => p !== uniqueMessage);
      spinner.text = makeMessage();
    },
    finish() {
      spinner.succeed('All commands got executed');
      onDone(start);
    },
    fail(project: string, output: string) {
      spinner.fail(`Project ${red(bold(project))} failed\n`);
      logger.log(output);
      onDone(start);
    },
    info(message: string) {
      spinner.stop();
      logger.info(message);
      spinner.start();
    },
  };
}

function makeAccumulativeSpinner() {
  const makeMessage = () => cyan(bold('Running')) + gray('\n- ' + inProgress.join('\n- '));
  const spinner = ora();
  const start = new Date();
  let inProgress: string[] = [];

  return {
    start(uniqueMessage: string) {
      inProgress = [...inProgress, uniqueMessage];
      spinner.start(makeMessage());
    },
    complete(uniqueMessage: string, _output: string) {
      inProgress = inProgress.filter((p) => p !== uniqueMessage);
      spinner.stop();
      logger.success(uniqueMessage);
      spinner.start(makeMessage());
    },
    finish() {
      spinner.stop();
      onDone(start);
    },
    fail(project: string, output: string) {
      spinner.fail(`Project ${red(bold(project))} failed\n`);
      logger.log(output);
      onDone(start);
    },
    info(message: string) {
      spinner.stop();
      logger.info(message);
      spinner.start();
    },
  };
}
