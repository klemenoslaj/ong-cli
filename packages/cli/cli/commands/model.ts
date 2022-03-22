import parser from 'yargs-parser';

export type AnyCommand = Command<readonly any[]>;

interface PromptResult<Args extends readonly unknown[]> {
  readonly execute: (...args: Args) => Promise<number>;
  readonly commandPrint: string;
  readonly args: Args;
}

export interface Command<Args extends readonly unknown[]> {
  readonly prompt: (args: readonly string[]) => Promise<PromptResult<Args>>;
  readonly parseArguments: (args: readonly string[]) => parser.Arguments;
}
