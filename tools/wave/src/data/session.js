const TestLoader = require('../testing/test-loader')
const UserAgentParser = require('../utils/user-agent-parser')

const PAUSED = 'paused'
const RUNNING = 'running'
const COMPLETED = 'completed'
const ABORTED = 'aborted'
const UNKNOWN = 'unknown'

class Session {
  constructor (
    token,
    {
      path,
      types,
      userAgent,
      tests,
      pendingTests,
      runningTests,
      completedTests,
      testTimeout,
      paused,
      status
    }
  ) {
    this._token = token
    this._path = path || ''
    this._types = types || [TestLoader.TEST_HARNESS_TESTS]
    this._userAgent = userAgent || null
    if (tests) {
      this._pendingTests = tests
      this._runningTests = {}
      this._completedTests = {}
    } else {
      this._pendingTests = pendingTests || {}
      this._runningTests = runningTests || {}
      this._completedTests = completedTests || {}
    }
    this._totalTestsCount = this._calculateTotalTests()
    this._testTimeout = testTimeout || null
    this._timeouts = []
    this._status = status || UNKNOWN
    this._clients = []
  }

  _calculateTotalTests () {
    let totalTestsCount = 0
    for (let api in this._pendingTests) {
      totalTestsCount += this._pendingTests[api].length
    }
    for (let api in this._runningTests) {
      totalTestsCount += this._runningTests[api].length
    }
    for (let api in this._completedTests) {
      totalTestsCount += this._completedTests[api].length
    }
    return totalTestsCount
  }

  nextTest (onTimeout) {
    let test
    let api
    let hasHttp = true
    let currentApi = 0
    let currentTest = 0
    const apis = Object.keys(this._pendingTests).sort(
      (testA, testB) => (testA.toLowerCase() > testB.toLowerCase() ? 1 : -1)
    )
    while (!test) {
      api = apis[currentApi]
      if (!api) return null
      test = this._pendingTests[api][currentTest]

      if (!test) {
        currentApi++
        currentTest = 0

        if (currentApi === apis.length) {
          if (hasHttp) {
            hasHttp = false
            currentApi = 0
          } else {
            return null
          }
        }
        test = null
        continue
      }

      if (test.indexOf('https') !== -1) {
        if (hasHttp) {
          currentTest++
          test = null
          continue
        }
      }
    }

    this._removeTestFromList(this._pendingTests, test, api)
    this._addTestToList(this._runningTests, test, api)

    if (this._testTimeout) {
      this._timeouts.push({
        test,
        timeout: setTimeout(
          () => onTimeout(this._token, test),
          this._testTimeout + 10000
        )
      })
    }
    return test
  }

  completeTest (test) {
    const api = test.split('/')[0]
    this._removeTestFromList(this._runningTests, test, api)
    this._addTestToList(this._completedTests, test, api)
    for (let i = 0; i < this._timeouts.length; i++) {
      if (this._timeouts[i].test === test) {
        clearTimeout(this._timeouts[i].timeout)
        this._timeouts.splice(i, 1)
        break
      }
    }
    this._clients.forEach(client => client.send('complete'))
  }

  _removeTestFromList (testList, test, api) {
    if (!testList[api]) return
    const index = testList[api].indexOf(test)
    if (index === -1) return
    testList[api].splice(index, 1)
    if (testList[api].length === 0) {
      delete testList[api]
    }
  }

  _addTestToList (testList, test, api) {
    if (testList[api] && testList[api].indexOf(test) !== -1) return
    if (!testList[api]) testList[api] = []
    testList[api].push(test)
  }

  isTestComplete (needleTest) {
    return this._testListContainsTest(needleTest, this._completedTests)
  }

  testExists (test) {
    return (
      this._testListContainsTest(test, this._pendingTests) ||
      this._testListContainsTest(test, this._runningTests) ||
      this._testListContainsTest(test, this._completedTests)
    )
  }

  _testListContainsTest (needleTest, testList) {
    return (
      Object.values(testList)
        .reduce((allTests, tests) => allTests.concat(tests), [])
        .findIndex(test => test === needleTest) >= 0
    )
  }

  isApiComplete (api) {
    return !this._pendingTests[api] && !this._runningTests[api]
  }

  addClient (client) {
    this._clients.push(client)
    return this
  }

  removeClient (client) {
    this._clients.splice(this._clients.indexOf(client), 1)
    return this
  }

  getToken () {
    return this._token
  }

  setToken (token) {
    this._token = token
    return this
  }

  getUserAgent () {
    return this._userAgent
  }

  setUserAgent (userAgent) {
    this._userAgent = userAgent
    return this
  }

  getPath () {
    if (this._path === '') {
      return '/'
    }
    return this._path
  }

  setPath (path) {
    this._path = path
    return this
  }

  getTypes () {
    return this._types
  }

  setTypes (types) {
    this._types = types
    return this
  }

  setTests (tests) {
    this._pendingTests = tests
    this._runningTests = {}
    this._completedTests = {}
    this._totalTestsCount = this._calculateTotalTests()
    return this
  }

  getPendingTests () {
    return this._pendingTests
  }

  getRunningTests () {
    return this._runningTests
  }

  getCompletedTests () {
    return this._completedTests
  }

  getTestTimeout () {
    return this._testTimeout
  }

  getTotalTestsCount () {
    return this._totalTestsCount
  }

  getStatus () {
    return this._status
  }

  setStatus (status) {
    this._status = status
    this._clients.forEach(client => client.send('status'))
    return this
  }
}

Session.RUNNING = RUNNING
Session.PAUSED = PAUSED
Session.COMPLETED = COMPLETED
Session.ABORTED = ABORTED
Session.UNKNOWN = UNKNOWN

module.exports = Session
