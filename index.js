const _ = require('lodash')
const githubhook = require('githubhook')
const npid = require('npid')
const dotenv = require('dotenv')
const logger = require('./src/simple-logger')
const initPing = require('./src/init-ping')
const {getGuardianConfig} = require('./src/get-guardian-config')
const {updateBranchProtection} = require('./src/update-branch-protection')

try {
  const pid = npid.create('./guardian-of-the-branches.pid', true)
  pid.removeOnExit()
} catch (err) {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
}


dotenv.config()

const log = logger.log('index:log')
const error = logger.error('index:error')

const expectedEnvVars = ['GITHUB_WEBHOOK_SECRET']

expectedEnvVars.forEach(envVar => {
  if (typeof process.env[envVar] !== 'string') {
    throw new Error(`Missing enviroment variable ${envVar}`)
  }
})


function setupGitHubWebhook() {
  const githubWebhook = githubhook({
    path: '/github/callback',
    port: process.env.PORT || 8080,
    secret: process.env.GITHUB_WEBHOOK_SECRET,
  })
  githubWebhook.listen()
  return githubWebhook
}

function performUpdate(repoFullName, branch, protectionConfig) {
  log(`sending branch protection update request for ${repoFullName}:${branch}`)


  return updateBranchProtection(process.env.GITHUB_TOKEN, repoFullName, branch, protectionConfig)
    .then(() => log(`branch protection for ${repoFullName}:${branch} was successfully updated`))
    .catch(error)
}

function run() {
  initPing()
  const guardianConfig = getGuardianConfig()
  const githubWebhook = setupGitHubWebhook()

  guardianConfig.repositories.forEach(repoConfig => {
    githubWebhook.on(`create:${repoConfig.name}`, (newBranchName, data) => {
      const repoFullName = data.repository.full_name
      const boundPerformUpdate = performUpdate.bind(null, repoFullName, newBranchName)

      log(`received create event for ${repoFullName}, new branch name: ${newBranchName}`)
      if (repoConfig.matchAllBranches) {
        log(`matched branch ${newBranchName} on ${repoConfig.name} under matchAllBranches rule, updating using baseProtectionConfig`)
        boundPerformUpdate(guardianConfig.baseProtectionConfig)
      } else {
        const matchedBranch = _.find(repoConfig.branches, branch => branch.nameFilterFn(newBranchName))
        if (matchedBranch) {
          log(`new branch ${newBranchName} matched the rule ${matchedBranch.name}, updating using protectionConfig of the found branch`)
          boundPerformUpdate(matchedBranch.protectionConfig)
        } else {
          log(`the branch ${newBranchName} did not match any of the rules for updating branch protection`)
        }
      }
    })
  })
}

if (require.main === module) {
  // If called direcly (i.e. not required)
  run()
}
