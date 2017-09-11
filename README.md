# guardian-of-the-branches

> Automatically add protection to github branches

### Why?

Our team works with release branches and we want to protect these branches against force pushing and wish to enforce submitting changes via pull requests on GitHub, which have to be reviewed by at least one team member before being merged. This script is watching for new branches which match configured pattern and will automatically set specified branch protection rules.


## Setup

 1. clone the repo and install dependencies using `yarn`
 2. create files `.env` and `guardian-config.yml`
 3. use `yarn start` (or `npm start`) to run the server
 4. configure GitHub repository webhooks and point it to server (make sure to use public IP)


## Configuration

#### .env:

 - `GITHUB_WEBHOOK_SECRET`: a secred shared with GitHub's webhook config (can be anything, as long as it's the same in the config and in the webhook config)
 - `GITHUB_TOKEN`: github token which authorizes at least repo permissions

#### guardian-config.yml

*For latest information about the expected branch protection payload, refer to [Update branch protection](https://developer.github.com/v3/repos/branches/#update-branch-protection) on GitHub API docs.*

 - `base_protection_config`: a common branch protection payload to be used for all branches, if not explicitly overriden in the config described below. It defaults to the minimal required object to configure the branch protection.

 - `repositories`: list of repositories to handle, each should contain the following properties:
   - `branches`: list of branches to match, each can be either a plain string (exact match) or an object, which can specify:
     - *(optional)* `name`: override name of branch to match (case insensitive, defaults to the name of branch key if not specified)
     - *(optional)* `regex`: regex used to match branches
     - *(optional)* `protection_config`: override any values inside `base_protection_config`. A deep merge is performed, but the last value will be overwritten (array, e.g. `required_status_checks.contexts` values **will not** be merged)

The list of branches can be left empty, in which case every new branch for the repo will be protected.

It is suggested to first try the `protection_config` payload on the API manually to verify that the config will work correctly

#### Webhook config on github repository

 - Go to repository -> Settings -> Webhooks
 - Click Add webhook and set:
   - Payload url: `[url to this webook server]/github/callback` (don't forget about using the correct port in the url)
   - Content type: application/json
   - Secret: the same secret as `GITHUB_WEBHOOK_SECRET` value in `.env`
   - Events: can be anything or "Let me select individual events." > "Create", for better performance

## Testing (development)

Use `yarn test` to run linter and tests or `yarn run test:coverage` to see coverage.

For watch mode (re-run tests when code changes), use `yarn run test:watch`.
