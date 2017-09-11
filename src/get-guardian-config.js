const fs = require('fs')
const path = require('path')
const yaml = require('yamljs')
const _ = require('lodash')

const projectRoot = path.resolve(__dirname, '..')
const defaultConfigPath = path.resolve(projectRoot, './guardian-config.yml')

// A minimal object required by the GitHub API in order for the request not to fail.
const defaultGuardianConfig = {
  required_pull_request_reviews: null,
  required_status_checks: {
    strict: false,
    contexts: [],
  },
  enforce_admins: false,
  restrictions: null,
}

function findConfigObjectKey(obj) {
  return _.findKey(obj, val => val === null)
}

function processBranch(baseProtectionConfig, branch) {
  const name = _.isString(branch) ? branch : findConfigObjectKey(branch)
  const matchName = _.get(branch, 'name', name)
  const branchNameRegex = new RegExp(`^(.*/)?${matchName}$`, 'i')
  let nameFilterFn = branchName => branchNameRegex.test(branchName)

  if (_.isObject(branch) && branch.regex) {
    // strip heading and trailing / if b
    const branchRegex = new RegExp(branch.regex.replace(/^\/?(.*?)\/?$/, '$1'))
    nameFilterFn = branchName => branchRegex.test(branchName)
  }

  return {
    name,
    nameFilterFn,
    protectionConfig: _.merge({}, baseProtectionConfig, branch.protection_config),
  }
}

function processRepo(baseProtectionConfig, repo) {
  const repoName = _.isString(repo) ? repo : findConfigObjectKey(repo)
  const branches = _.compact(_.get(repo, 'branches', []))

  return {
    name: repoName,
    branches: branches.map(processBranch.bind(null, baseProtectionConfig)),
    matchAllBranches: _.isEmpty(branches)
  }
}

function getGuardianConfig(configPath = defaultConfigPath) {
  try {
    fs.accessSync(configPath, fs.constants.F_OK)
  } catch (e) {
    throw new Error(`No guardian-config found at path ${configPath}`)
  }

  const guardianConfig = yaml.load(configPath)
  const baseProtectionConfig = _.merge({}, defaultGuardianConfig, guardianConfig.base_protection_config)

  return {
    baseProtectionConfig,
    repositories: guardianConfig.repositories.map(processRepo.bind(null, baseProtectionConfig))
  }
}

module.exports = {
  defaultConfigPath,
  defaultGuardianConfig,
  getGuardianConfig,
}
