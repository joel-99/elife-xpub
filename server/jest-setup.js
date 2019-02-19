const { db } = require('pubsweet-server')
const replaySetup = require('../test/helpers/replay-setup')

replaySetup('success')

// The pipeline complains at the default of 5s - so double it!
jest.setTimeout(10000)

jest.mock('@pubsweet/component-send-email', () => ({
  _sendPromise: null,
  mails: [],
  send(mailData) {
    this._sendPromise = new Promise((resolve, reject) => {
      this.mails.push(mailData)
      resolve()
    })
    return this._sendPromise
  },
  getMails() {
    return this.mails
  },
  clearMails() {
    this.mails = []
  },
}))

afterAll(() => db.destroy())
