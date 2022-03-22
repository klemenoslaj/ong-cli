export const enum Commands {
  // Build commands
  BuildEverything = 'build:all',
  BuildEveryLibrary = 'build:libs',
  BuildInteractive = 'build',
  BuildChanged = 'build:changed',
  BuildAffected = 'build:affected',
  // Lint commands
  LintEverything = 'lint:all',
  LintInteractive = 'lint',
  LintChanged = 'lint:changed',
  LintAffected = 'lint:affected',
  // Test commands
  TestEverything = 'test:all',
  TestInteractive = 'test',
  TestChanged = 'test:changed',
  TestAffected = 'test:affected',
  // FormatAll,
  // Format,
  // Codegen,
  // ResetRepo,
  // CleanRepo,
  // ServeApp,
  DeployEveryLibrary = 'deploy',
  DebugGraph = 'debug:graph',
}
