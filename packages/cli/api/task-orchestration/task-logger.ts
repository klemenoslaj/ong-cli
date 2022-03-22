import { prebuiltSpinners } from '../../spinner';

export function makeTaskLogger(verbose: boolean, parallel: number) {
  if (verbose) {
    if (parallel === 1) {
      return prebuiltSpinners.immediate();
    }

    return prebuiltSpinners.delayed();
  }

  return prebuiltSpinners.default();
}
