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

import { gray, yellow } from 'kleur/colors';
import logSymbols from 'log-symbols';

export const messages = {
  info(message: string) {
    return `${logSymbols.info} ${gray(message)}\n`;
  },
  warn(message: string) {
    return `${logSymbols.warning} ${yellow(message)}\n`;
  },
  success(message: string) {
    return `${logSymbols.success} ${message}\n`;
  },
  error(message: string) {
    return `${logSymbols.error} ${message}\n`;
  },
  log(message: string) {
    return message + '\n';
  },
};

export const logger = {
  info(message: string) {
    process.stdout.write(messages.info(message));
  },
  warn(message: string) {
    process.stdout.write(messages.warn(message));
  },
  success(message: string) {
    process.stdout.write(messages.success(message));
  },
  error(message: string) {
    process.stdout.write(messages.error(message));
  },
  log(message: string) {
    process.stdout.write(messages.log(message));
  },
};

export const terminal = {
  removeCursor() {
    process.stdout.write('\x1B[?25l');
  },
  restoreCursor() {
    process.stdout.write('\x1B[?25h');
  },
};
