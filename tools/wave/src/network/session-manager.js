const uuidv1 = require('uuid/v1')
const crypto = require('crypto')

const Session = require('../data/session')
const TestLoader = require('../testing/test-loader')

const DEFAULT_TEST_PATH = '/'
const DEFAULT_TEST_TYPES = [TestLoader.TEST_HARNESS_TESTS]

class SessionManager {
  constructor ({ database, testTimeout, testLoader }) {
    this._database = database
    this._sessions = []
    this._testTimeout = testTimeout
    this._testLoader = testLoader
  }

  async initialize () {
    const sessions = await this.getSessions()
    await this._database.loadSessions(sessions)
  }

  async findToken (fragment) {
    const tokens = await this._database.findTokens(fragment)
    if (tokens.length === 1) {
      return tokens[0]
    }
    return null
  }

  async createSession ({ userAgent, path, types, reftoken, testTimeout }) {
    path = path || DEFAULT_TEST_PATH
    types = types || DEFAULT_TEST_TYPES
    testTimeout = testTimeout || this._testTimeout

    let refSessions = []
    if (reftoken) {
      refSessions = reftoken.split(',')
      refSessions = refSessions.map(async s => this.getSession(s.trim()))
      refSessions = await Promise.all(refSessions)
    }

    const token = this.generateUuid()
    const tests = await this._testLoader.getTests({
      userAgent,
      path,
      refSessions,
      types
    })

    const session = new Session(token, {
      userAgent,
      path,
      types,
      testTimeout,
      tests,
      status: Session.RUNNING
    })
    await this._database.createSession(session)
    this._sessions.push(session)
    return session
  }

  async addSession (session) {
    await this._database.createSession(session)
    this._sessions.push(session)
  }

  async updateSession (session) {
    return this._database.updateSession(session)
  }

  generateUuid () {
    return uuidv1({
      node: new Uint8Array(crypto.randomBytes(6)),
      clockseq: (Math.random() * 0x3fff) | 0
    })
  }

  async getSession (token) {
    if (!token) return null
    let session = this._sessions.find(session => session.getToken() === token)
    if (!session) {
      session = await this._database.readSession(token)
      if (session) this._sessions.push(session)
    }
    return session
  }

  async getSessions () {
    return await this._database.readSessions()
  }
}

module.exports = SessionManager
