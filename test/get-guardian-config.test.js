import test from 'ava'
import sinon from 'sinon'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'

import {
  getGuardianConfig,
  defaultGuardianConfig,
  defaultConfigPath,
} from '../src/get-guardian-config'

const guardianConfig = getGuardianConfig(path.resolve(__dirname, './mocks/guardian-config.mock.yml'))
const guardianConfigWithoutDefaults = getGuardianConfig(path.resolve(__dirname, './mocks/guardian-config-no-defaults.mock.yml'))

function assertConfigVal(configKeyPath, expected, config = guardianConfig) {
  test(configKeyPath, t => {
    const actual = _.get(config, configKeyPath)
    const msg = `${configKeyPath} is ${expected}`

    t.deepEqual(actual, expected, msg)
  })
}

assertConfigVal(
  'baseProtectionConfig.required_status_checks.strict',
  true
)
assertConfigVal(
  'baseProtectionConfig.required_status_checks.contexts',
  ['ci/circleci: build']
)
assertConfigVal(
  'baseProtectionConfig.required_pull_request_reviews.dismissal_restrictions.users',
  ['octocat']
)
assertConfigVal(
  'baseProtectionConfig.required_pull_request_reviews.dismissal_restrictions.teams',
  ['justice-league']
)
assertConfigVal(
  'baseProtectionConfig.required_pull_request_reviews.dismiss_stale_reviews',
  true
)
assertConfigVal(
  'baseProtectionConfig.required_pull_request_reviews.require_code_owner_reviews',
  true
)
assertConfigVal(
  'baseProtectionConfig.enforce_admins',
  true
)
assertConfigVal(
  'baseProtectionConfig.restrictions.users',
  ['octocat']
)
assertConfigVal(
  'baseProtectionConfig.restrictions.teams',
  ['justice-league']
)


const expectedRepos = [
  {
    expectedRepoName: 'blank-repo',
    expectedRepoBranches: [],
    expectedmatchAllBranches: true,
  },
  {
    expectedRepoName: 'repo-without-branches',
    expectedRepoBranches: [],
    expectedmatchAllBranches: true,
  },
  {
    expectedRepoName: 'repo-with-empty-branches',
    expectedRepoBranches: [],
    expectedmatchAllBranches: true,
  },
  {
    expectedRepoName: 'basic-repo',
    expectedRepoBranches: ['branch1', 'branch2', 'branch3'],
    expectedmatchAllBranches: false,
  },
  {
    expectedRepoName: 'repo-with-empty-branch-config',
    expectedRepoBranches: ['branch1', 'branch2', 'branch3'],
    expectedmatchAllBranches: false,
  },
  {
    expectedRepoName: 'repo-with-branch-name-override',
    expectedRepoBranches: ['branch1', 'branch2', 'branch3'],
    expectedmatchAllBranches: false,
  },
  {
    expectedRepoName: 'repo-with-branch-regex-override',
    expectedRepoBranches: ['branch1', 'branch2', 'branch3'],
    expectedmatchAllBranches: false,
  },
  {
    expectedRepoName: 'repo-with-branch-protection_config-override',
    expectedRepoBranches: [
      'branch-overriding-required_status_checks-strict',
      'branch-overriding-required_status_checks-contexts',
      'branch-overriding-required_pull_request_reviews-whole-dismissal_restrictions',
      'branch-overriding-required_pull_request_reviews-dismissal_restrictions-users',
      'branch-overriding-required_pull_request_reviews-dismissal_restrictions-teams',
      'branch-overriding-required_pull_request_reviews-dismiss_stale_reviews',
      'branch-overriding-required_pull_request_reviews-require_code_owner_reviews',
      'branch-overriding-enforce_admins',
      'branch-overriding-whole-restrictions',
      'branch-overriding-restrictions-users',
      'branch-overriding-restrictions-teams',
    ],
    expectedmatchAllBranches: false,
    skipConfigCheck: true,
  },
]

expectedRepos.forEach(({expectedRepoName, expectedRepoBranches, expectedmatchAllBranches, skipConfigCheck = false}, repoIndex) => {
  test(`repo at index ${repoIndex} should be named ${expectedRepoName}`, t => {
    const repo = guardianConfig.repositories[repoIndex]

    t.is(repo.name, expectedRepoName, `repo name is ${expectedRepoName}`)

    t.is(repo.matchAllBranches, expectedmatchAllBranches, `repo ${repo.name} should define matchAllBranches as ${expectedmatchAllBranches}`)

    expectedRepoBranches.forEach((expectedBranchName, branchI) => {
      const branch = repo.branches[branchI]
      const branchMsg = `branch in repo ${expectedRepoName} at index ${branchI} should be named ${expectedBranchName}`

      t.is(branch.name, expectedBranchName, branchMsg)

      const actualBranchNameFilterFnType = typeof branch.nameFilterFn
      const nameFilterFnMsg = `nameFilterFn for branch in repo ${expectedRepoName} at index ${branchI} should be a function`

      t.is(actualBranchNameFilterFnType, 'function', nameFilterFnMsg)

      if (!skipConfigCheck) {
        const actualConfig = branch.protectionConfig
        const expectedConfig = guardianConfig.baseProtectionConfig
        const configMsg = `config for branch in repo ${expectedRepoName} at index ${branchI} should match guardianConfig`

        t.deepEqual(actualConfig, expectedConfig, configMsg)
      }
    })
  })
})


const lastRepo = _.last(guardianConfig.repositories)

assertConfigVal(
  'protectionConfig.required_status_checks.strict',
  false,
  lastRepo.branches[0]
)
assertConfigVal(
  'protectionConfig.required_status_checks.contexts',
  ['ci/circleci: test', 'ci/circleci: build'],
  lastRepo.branches[1]
)
assertConfigVal(
  'protectionConfig.required_pull_request_reviews.dismissal_restrictions.users',
  ['user1', 'user2', 'user3'],
  lastRepo.branches[2]
)
assertConfigVal(
  'protectionConfig.required_pull_request_reviews.dismissal_restrictions.teams',
  ['team1', 'team2'],
  lastRepo.branches[2]
)
assertConfigVal(
  'protectionConfig.required_pull_request_reviews.dismissal_restrictions.users',
  ['user11', 'user12', 'user13'],
  lastRepo.branches[3]
)
assertConfigVal(
  'protectionConfig.required_pull_request_reviews.dismissal_restrictions.teams',
  ['team11', 'team12'],
  lastRepo.branches[4]
)
assertConfigVal(
  'protectionConfig.required_pull_request_reviews.dismiss_stale_reviews',
  false,
  lastRepo.branches[5]
)
assertConfigVal(
  'protectionConfig.required_pull_request_reviews.require_code_owner_reviews',
  false,
  lastRepo.branches[6]
)
assertConfigVal(
  'protectionConfig.enforce_admins',
  false,
  lastRepo.branches[7]
)
assertConfigVal(
  'protectionConfig.restrictions.users',
  ['user11', 'user21', 'user31'],
  lastRepo.branches[8]
)
assertConfigVal(
  'protectionConfig.restrictions.teams',
  ['team11', 'team21'],
  lastRepo.branches[8]
)
assertConfigVal(
  'protectionConfig.restrictions.users',
  ['user21', 'user22', 'user23'],
  lastRepo.branches[9]
)
assertConfigVal(
  'protectionConfig.restrictions.teams',
  ['team21', 'team22'],
  lastRepo.branches[10]
)


test('thorws if config path does not exist', t => {
  const erroneousPath = './a'

  t.throws(() => getGuardianConfig(erroneousPath), Error, `No guardian-config found at path ${erroneousPath}`)
})


const basicBranchTests = [
  [
    {testStr: 'branch1', expected: true},
    {testStr: 'Branch1', expected: true},
    {testStr: 'branch11', expected: false},
    {testStr: 'branch2', expected: false},
    {testStr: 'master', expected: false},
  ],
  [
    {testStr: 'branch2', expected: true},
    {testStr: 'Branch2', expected: true},
    {testStr: 'branch22', expected: false},
    {testStr: 'branch1', expected: false},
    {testStr: 'master', expected: false},
  ],
  [
    {testStr: 'branch3', expected: true},
    {testStr: 'Branch3', expected: true},
    {testStr: 'branch33', expected: false},
    {testStr: 'branch1', expected: false},
    {testStr: 'master', expected: false},
  ],
]

const branchNameFilterFnTestCases = [
  {
    repoIndex: 3,
    branchTests: basicBranchTests,
  },
  {
    repoIndex: 5,
    branchTests: [
      [
        {testStr: 'master', expected: true},
        {testStr: 'Master', expected: true},
        {testStr: 'branch11', expected: false},
        {testStr: 'branch2', expected: false},
        {testStr: 'master1', expected: false},
      ],
      ..._.tail(basicBranchTests),
    ]
  },
  {
    repoIndex: 6,
    branchTests: [
      [
        {testStr: 'release/0.0.1', expected: true},
        {testStr: 'release/1.0.0', expected: true},
        {testStr: 'release/1.2.3', expected: true},
        {testStr: 'release/2.0.0', expected: true},
        {testStr: 'release/2.2.2.2', expected: true},
        {testStr: 'Release/2.0.0', expected: false},
        {testStr: 'release', expected: false},
        {testStr: 'branch11', expected: false},
        {testStr: 'branch2', expected: false},
        {testStr: 'master1', expected: false},
      ],
      ..._.tail(basicBranchTests),
    ]
  },
]

branchNameFilterFnTestCases.forEach(({repoIndex, branchTests}) => {
  const repo = guardianConfig.repositories[repoIndex]

  branchTests.forEach((testCases, branchI) => {
    const branch = repo.branches[branchI]

    testCases.forEach(({testStr, expected}) => {
      const actual = branch.nameFilterFn(testStr)
      const msg = `Branch ${branch.name} in repo ${repo.name} should return ${expected} when nameFilterFn is called with ${testStr}`

      test(msg, t => {
        t.is(actual, expected, msg)
      })
    })
  })
})

test('config without baseProtectionConfig', t => {
  const branch = _.first(_.first(guardianConfigWithoutDefaults.repositories).branches)

  const actual = branch.protectionConfig
  const expected = defaultGuardianConfig
  const msg = 'config without base_protection_config should default to minimal viable payload object'

  t.deepEqual(actual, expected, msg)
})

test('getGuardianConfig configPath defaults to [project-root]/guardian-config.yml if no argument is passed', t => {
  // Store the original fs.accessSync so it can be restored later
  const originalAccessSync = fs.accessSync
  // Override fs.accessSync. This works because the imports are cached and it's shared with the tested code.
  // Source: https://stackoverflow.com/a/15724832/1276128
  fs.accessSync = function () {
    // Throw an error to trigger the `catch` block inside `getGuardianConfig`.
    // The function thinks the path is not accessible (same behaviour as with the actual API, just a different error).
    // We want this so the `getGuardianConfig` function stops before parsing the default config file.
    throw new Error()
  }
  // Spy on the mocked `fs.accessSync` function so we can verify the value which the function was called with.
  sinon.spy(fs, 'accessSync')

  try {
    // Call the function without arguments, catch the error which is thrown above (otherwise the test breaks).
    getGuardianConfig()
  } catch (e) {} // eslint-disable-line no-empty

  const actual = fs.accessSync.getCall(0).args[0]
  const expected = defaultConfigPath
  const msg = `fs.accessSync() should have been called with defaultConfigPath (${defaultConfigPath}) when getGuardianConfig() was called without args`

  t.is(actual, expected, msg)

  // Restore the `fs.accessSync` function to the original value.
  fs.accessSync = originalAccessSync
})
