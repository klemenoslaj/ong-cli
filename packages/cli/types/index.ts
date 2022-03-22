import { WorkspaceSchema } from '@schematics/angular/utility/workspace-models';

export interface PackageJSON {
  readonly name: string;
  readonly version: string;
  readonly peerDependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly scripts?: { readonly [script: string]: string };
  readonly schematics?: string;
}

export interface WorkspacePackageJSON extends Omit<PackageJSON, 'dependencies'> {
  readonly dependencies: Record<string, string>;
}

export interface MissingWorkspaceSchema {
  readonly newProjectRoot?: string;
  readonly schematics: Record<string, object>;
}

export interface CompleteWorkspaceSchema extends WorkspaceSchema, MissingWorkspaceSchema {}
