import { ProcessShare } from '../graph';

/**
 * The message is returned by the child process or a worker thread.
 */
export interface ThreadMessage {
  readonly code: number;
  readonly project: string;
  readonly output: string;
}

export interface ParentMessage {
  readonly cliArgs: readonly string[];
  readonly verbose: boolean;
  readonly share: ProcessShare | null;
}
