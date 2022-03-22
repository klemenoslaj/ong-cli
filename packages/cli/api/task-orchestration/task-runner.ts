import run from '@angular/cli';
import { __unwrapFromProcessShare__ } from '../graph';

import type { ParentMessage, ThreadMessage } from './model';

process.title = 'node UNUSED';

let restoreOutput: ReturnType<typeof watchAndStoreOutput>;

const postMessage = (code: number, project: string) => {
  process.title = 'node UNUSED';
  process.send?.(<ThreadMessage>{ code, project, output: restoreOutput() });
};

process.on('message', ({ cliArgs, verbose, share }: ParentMessage) => {
  share && __unwrapFromProcessShare__(share);
  const [, project] = cliArgs;
  process.title = 'node ' + cliArgs.join(' ');
  restoreOutput ??= watchAndStoreOutput(verbose);
  try {
    run({ cliArgs: <string[]>cliArgs }).then(
      (code) => postMessage(code, project),
      (code) => postMessage(code, project),
    );
  } catch (e) {
    console.log(e);
    process.send?.(<ThreadMessage>{ code: 1, project, output: e });
  }
});

/**
 * Patches the stdout and stderr and prevents any terminal output
 * unless in verbose mode.
 *
 * Collect the actual output that will be dumped it in case the command fails.
 */
function watchAndStoreOutput(verbose: boolean) {
  const originalStdout = process.stdout._write;
  const originalStderr = process.stderr._write;

  let output = '';

  process.stdout._write = (chunk: any, _: BufferEncoding, callback: (error?: Error | null) => void) => {
    output += chunk;
    if (verbose) {
      originalStdout.call(process.stdout, chunk, _, callback);
    } else {
      callback();
    }
  };

  process.stderr._write = (chunk: any, _: BufferEncoding, callback: (error?: Error | null) => void) => {
    output += chunk;
    if (verbose) {
      originalStderr.call(process.stderr, chunk, _, callback);
    } else {
      callback();
    }
  };

  return function restoreOutout() {
    const result = output;
    output = '';
    return result;
  };
}
