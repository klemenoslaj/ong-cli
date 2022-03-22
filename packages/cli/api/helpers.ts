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

export function awaitable<T>(promise: Promise<T>) {
  return promise.then(
    (result) => <const>[null, result],
    (error: number) => <const>[error, null],
  );
}
