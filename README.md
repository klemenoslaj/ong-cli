# ong-cli

This was a quick experiment to build Angular projects in parallel.
**Not production ready**

## Usage

1. Execute `yarn install`
2. Execute `yarn workspace @ong-devkit/cli build`
3. Execute `yarn workspace demo ong`

> NOTE: `demo` is an example Angular repo with multiple libraries and an application
meant for testing. only

> NOTE: `ong-cli` will print something like `ong build:all --prod --parallel 5`. This
is a hint for a one liner usage without going trough the wizard: `yarn workspace demo ong build:all --prod --parallel 5`

## Example

https://user-images.githubusercontent.com/7548247/159518762-f070835a-6147-40b1-a88b-65e14bd0f292.mov
