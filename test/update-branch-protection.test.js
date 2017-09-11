import test from 'ava'
import sinon from 'sinon'
import request from 'request'

import {
  updateBranchProtection,
  updateBranchProtectionApiUrl,
} from '../src/update-branch-protection'
import {defaultGuardianConfig} from '../src/get-guardian-config'

const apiToken = '123'
const repoFullName = 'markogresak/test-repo'
const branch = 'test-branch'
const protectionConfig = defaultGuardianConfig

function mockRequest(callCbFn) {
  const originalRequestPut = request.put

  request.put = function (opts, cb) {
    callCbFn(cb)
  }
  sinon.spy(request, 'put')

  function restoreRequestPut() {
    request.put = originalRequestPut
  }

  return restoreRequestPut
}

test('updateBranchProtection call to request.put', t => {
  const restoreRequestPut = mockRequest(cb => {
    cb()
  })

  const updatePromise = updateBranchProtection(apiToken, repoFullName, branch, protectionConfig)

  const actual = request.put.getCall(0).args[0]
  const expected = {
    url: updateBranchProtectionApiUrl(repoFullName, branch),
    json: protectionConfig,
    auth: {
      bearer: apiToken,
    },
    headers: {
      'User-Agent': 'guardian-of-the-branches', // this is required by the GitHub or it will fail
    },
  }
  const msg = 'updateBranchProtection should call request.put where payload includes the passed arguments corresponding to the expected request API usage'

  t.deepEqual(actual, expected, msg)

  restoreRequestPut()

  return updatePromise.then(payload => {
    t.deepEqual(payload, {repoFullName, branch})
  })
})

test('updateBranchProtection when request.put calls the callback with a string error', t => {
  const err = 'err123'

  const restoreRequestPut = mockRequest(cb => {
    cb(err)
  })

  const updatePromise = updateBranchProtection(apiToken, repoFullName, branch, protectionConfig)

  restoreRequestPut()

  return updatePromise.catch(error => {
    const actualErrorMsg = error.message
    const expectedErrorMessage = `an error occured when trying to send a request for ${repoFullName}:${branch}, ${err}`
    const msg = 'when the request callback is called with an error, the promise should be rejected with an errror describing on which repo:branch the error occured'

    t.is(actualErrorMsg, expectedErrorMessage, msg)
  })
})

test('updateBranchProtection when request.put calls the callback with a instanceof error error', t => {
  const err = new Error('abc123')

  const restoreRequestPut = mockRequest(cb => {
    cb(err)
  })

  const updatePromise = updateBranchProtection(apiToken, repoFullName, branch, protectionConfig)

  restoreRequestPut()

  return updatePromise.catch(error => {
    const actualErrorMsg = error.message
    const expectedErrorMessage = `an error occured when trying to send a request for ${repoFullName}:${branch}, ${err.message}\n${err.stack}`
    const msg = 'when the request callback is called with an error, the promise should be rejected with an errror describing on which repo:branch the error occured'

    t.is(actualErrorMsg, expectedErrorMessage, msg)
  })
})

test('updateBranchProtection when request.put calls the callback with response.statusCode 400', t => {
  const response = {
    statusCode: 400,
  }

  const restoreRequestPut = mockRequest(cb => {
    cb(null, response)
  })

  const updatePromise = updateBranchProtection(apiToken, repoFullName, branch, protectionConfig)

  restoreRequestPut()

  return updatePromise.catch(error => {
    const actualErrorMsg = error.message
    const expectedErrorMessage = `Request for ${repoFullName}:${branch} responded with status code ${response.statusCode}`
    const msg = 'when the request callback is called with a response where statusCode is >= 400, the promise should be rejected with an errror describing on which repo:branch the bad response occured'

    t.is(actualErrorMsg, expectedErrorMessage, msg)
  })
})

test('updateBranchProtection when request.put calls the callback with response.statusCode 400 with a body', t => {
  const response = {
    statusCode: 400,
  }

  const body = {
    test: {
      a: {
        b: 123,
      },
    },
  }

  const restoreRequestPut = mockRequest(cb => {
    cb(null, response, body)
  })

  const updatePromise = updateBranchProtection(apiToken, repoFullName, branch, protectionConfig)

  restoreRequestPut()

  return updatePromise.catch(error => {
    const actualErrorMsg = error.message
    const expectedErrorMessage = `Request for ${repoFullName}:${branch} responded with status code ${response.statusCode}\n${JSON.stringify(body, null, 2)}`
    const msg = 'when the request callback is called with a response where statusCode is >= 400 and a body, the promise should be rejected with an errror describing on which repo:branch the bad response occured and string value of body'

    t.is(actualErrorMsg, expectedErrorMessage, msg)
  })
})
