const request = require('request')

const githubApiBaseUrl = 'https://api.github.com'

function updateBranchProtectionApiUrl(repoFullName, branch) {
  return `${githubApiBaseUrl}/repos/${repoFullName}/branches/${branch}/protection`
}

function stringifyError(err) {
  if (err instanceof Error) {
    return `${err.message}\n${err.stack}`
  }
  return err
}

function updateBranchProtection(apiToken, repoFullName, branch, protectionConfig) {
  return new Promise((resolve, reject) => {
    const requestOpts = {
      url: updateBranchProtectionApiUrl(repoFullName, branch),
      json: protectionConfig,
      auth: {
        bearer: apiToken,
      },
      headers: {
        'User-Agent': 'guardian-of-the-branches', // this is required by the GitHub or it will fail
      },
    }

    request.put(requestOpts, (err, response, body) => {
      const bodyStr = body ? `\n${JSON.stringify(body, null, 2)}` : ''
      if (err) {
        return reject(new Error(`an error occured when trying to send a request for ${repoFullName}:${branch}, ${stringifyError(err)}${bodyStr}`))
      }
      if (response && response.statusCode >= 400) {
        return reject(new Error(`Request for ${repoFullName}:${branch} responded with status code ${response.statusCode}${bodyStr}`))
      }

      resolve({repoFullName, branch})
    })
  })
}

module.exports = {
  updateBranchProtection,
  updateBranchProtectionApiUrl,
}
