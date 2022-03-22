# Public API imports

This package is split into smaller chunks:

- `@ong-devkit/cli` - exports version of package
- `@ong-devkit/cli/cli` - manually bootstrap the CLI
- `@ong-devkit/cli/logger` - logger used by the CLI
- `@ong-devkit/cli/spinner` - spinner used by the CLI
- `@ong-devkit/api/*` - rich API to build custom functionality

> NOTE: Only use one import depth for `api`, such as `@ong-devkit/api/helpers`.
> Anything deeper is **not** public API.

# Contributing

**Internal API**

- Do not export any entitiy from public API for the internal usage
- Do deeply import internal entity from the file it originates from
