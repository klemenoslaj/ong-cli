import { ChildProcess, fork } from 'child_process';
import { join } from 'path';

import { __wrapForProcessShare__ } from '../graph';
import type { ParentMessage, ThreadMessage } from './model';

function scheduleQueueTasks(
  parallel: number,
  amount: number,
  create: () => ChildProcess,
  send: <D extends readonly string[]>(thread: ChildProcess, data: D) => void,
  destroy: (thread: ChildProcess) => void,
) {
  const threads = new Array<ChildProcess>(parallel);
  const released: ChildProcess[] = [];
  const pending: Function[] = [];
  let threadIndex = 0;
  let handled = 0;

  return {
    execute<D extends readonly string[]>(dataProvider: () => D) {
      return new Promise<ThreadMessage>((resolve, reject) => {
        if (released.length > 0) {
          handle(released.pop() ?? (threads[threadIndex++] = create()));
        } else if (threadIndex < parallel) {
          handle((threads[threadIndex++] = create()));
        } else {
          pending.push(() => handle(released.pop() as ChildProcess));
        }

        function handle(thread: ChildProcess) {
          send(thread, dataProvider());
          thread.once('message', (error: ThreadMessage) => {
            +error.code ? reject(error) : resolve(error);

            if (amount - handled++ < threadIndex) {
              // The thread is not needed any longer, destroy it
              // to release the resources
              threadIndex--;
              destroy(thread);
              threads.splice(threads.indexOf(thread), 1);
              return;
            }

            released.push(thread);
            pending.shift()?.(thread);
          });
        }
      });
    },
    terminate() {
      for (const thread of threads) {
        thread && destroy(thread);
      }
    },
  };
}

/**
 * Schedules child processes with the provided workerFile.
 * It will only spawn the child process if required and will close it
 * as soon as possible to release any resource.
 */
export function makeTasksQueue(parallel: number, amount: number, verbose: boolean, shareGraph = true) {
  const workerFile = join(__dirname, './task-runner.js');
  const share = shareGraph ? __wrapForProcessShare__() : null;
  verbose = verbose && parallel === 1;

  // if (parallel === 1) {
  //   return scheduleThreads(
  //     parallel,
  //     amount,
  //     () => fakeProcess(),
  //     (emitter, cliArgs) => emitter.emit('args', { cliArgs, verbose }),
  //     emitter => emitter.removeAllListeners()
  //   );
  // }

  return scheduleQueueTasks(
    parallel,
    amount,
    () => fork(workerFile),
    (child, cliArgs) => child.send(<ParentMessage>{ cliArgs, share, verbose }),
    (child) => child.kill(),
  );
}

// function fakeProcess() {
//   const events = new EventEmitter();

//   events.on('args', ({ cliArgs }: ParentMessage) => {
//     const [, project] = cliArgs;
//     run({ cliArgs: <string[]>cliArgs }).then(
//       code => events.emit('message', { code, project, output: '' }),
//       code => events.emit('message', { code, project, output: '' })
//     );
//   });

//   return events;
// }

// /**
//  * Schedules worker threads with the provided workerFile.
//  * It will only spawn the worker if required and will close it
//  * as soon as possible to release any resource.
//  *
//  * @param workerFile File to execute in a worker thread
//  * @param parallel The maximum amount of concurrent processes
//  * @param amount The full amount of tasks
//  */
// export function scheduleWorkerThreads(workerFile: string, parallel: number, amount: number, verbose: boolean) {
//   const isVerbose = verbose && amount === 1;
//   return scheduleThreads(
//     parallel,
//     amount,
//     () => new Worker(workerFile),
//     (child, cliArgs) => child.postMessage({ cliArgs, verbose: isVerbose }),
//     child => child.terminate()
//   );
// }
