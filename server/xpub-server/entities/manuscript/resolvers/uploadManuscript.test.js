jest.mock('pubsweet-server/src/graphql/pubsub', () => ({
  getPubsub: () => Promise.resolve({ publish: jest.fn() }),
  asyncIterators: {},
}))
jest.mock('@pubsweet/logger')

const config = require('config')
const fs = require('fs-extra')
const stream = require('stream')
const logger = require('@pubsweet/logger')
const { createTables } = require('@pubsweet/db-manager')
const mailer = require('@pubsweet/component-send-email')
const startS3rver = require('../../../test/mock-s3-server')
const { User, File, Manuscript } = require('@elifesciences/xpub-model')
const { Mutation } = require('.')
const { userData, badUserData } = require('./index.test.data')

const replaySetup = require('../../../../../test/helpers/replay-setup')

describe('Manuscripts', () => {
  const profileId = userData.identities[0].identifier
  const badProfileId = badUserData.identities[0].identifier
  let userId

  beforeEach(async () => {
    replaySetup('success')
    await createTables(true)
    const [user] = await Promise.all([
      new User(userData).save(),
      new User(badUserData).save(),
    ])
    userId = user.id
    mailer.clearMails()
  })

  describe('uploadManuscript', () => {
    let s3Server

    beforeEach(async () => {
      const server = await startS3rver({
        ...config.get('aws.credentials'),
        ...config.get('aws.s3'),
      })
      s3Server = server.instance
    })

    afterEach(done => {
      s3Server.close(done)
    })

    it("fails if manuscript doesn't belong to user", async () => {
      const blankManuscript = new Manuscript()
      blankManuscript.createdBy = userId
      const manuscript = await blankManuscript.save()

      await expect(
        Mutation.uploadManuscript(
          {},
          { id: manuscript.id },
          { user: badProfileId },
        ),
      ).rejects.toThrow('Manuscript not found')
    })

    it('saves manuscript to S3', async () => {
      const blankManuscript = new Manuscript({ createdBy: userId })
      const { id } = await blankManuscript.save()
      const fileUpload = {
        filename: 'manuscript.pdf',
        stream: fs.createReadStream(
          `${__dirname}/../../../../../test/fixtures/dummy-manuscript-2.pdf`,
        ),
        mimetype: 'application/pdf',
      }
      await Mutation.uploadManuscript(
        {},
        { id, file: fileUpload, fileSize: 73947 },
        { user: profileId },
      )

      const loadedManuscript = await Manuscript.find(id, userId)
      const pdfBinary = await loadedManuscript.getSource().getContent()
      expect(pdfBinary.toString().substr(0, 6)).toEqual('%PDF-1')
    })

    it('fails if S3 upload fails', async () => {
      jest
        .spyOn(File.prototype, 'putContent')
        .mockImplementationOnce(() =>
          Promise.reject(new Error('Failed to persist file')),
        )
      const blankManuscript = new Manuscript({ createdBy: userId })
      const { id } = await blankManuscript.save()
      const file = {
        filename: 'manuscript.pdf',
        stream: fs.createReadStream(
          `${__dirname}/../../../../../test/fixtures/dummy-manuscript-2.pdf`,
        ),
        mimetype: 'application/pdf',
      }
      await expect(
        Mutation.uploadManuscript(
          {},
          { id, file, fileSize: 73947 },
          { user: profileId },
        ),
      ).rejects.toThrow('Failed to persist file')

      const manuscript = await Manuscript.find(id, userId)
      expect(manuscript.files).toHaveLength(0)
    })

    it('sets empty title if ScienceBeam fails', async () => {
      jest.spyOn(logger, 'warn').mockImplementationOnce(() => {})
      replaySetup('error')
      const blankManuscript = new Manuscript({ createdBy: userId })
      const { id } = await blankManuscript.save()
      const file = {
        filename: 'manuscript.pdf',
        stream: fs.createReadStream(
          `${__dirname}/../../../../../test/fixtures/dummy-manuscript-2.pdf`,
        ),
        mimetype: 'application/pdf',
      }
      const manuscript = await Mutation.uploadManuscript(
        {},
        { id, file, fileSize: 73947 },
        { user: profileId },
      )
      expect(manuscript).toMatchObject({
        id,
        meta: { title: '' },
        files: [{ filename: 'manuscript.pdf' }],
      })
      expect(logger.warn).toHaveBeenCalled()
    })

    it('extracts title from PDF', async () => {
      const blankManuscript = new Manuscript({ createdBy: userId })
      const { id } = await blankManuscript.save()
      const file = {
        filename: 'manuscript.pdf',
        stream: fs.createReadStream(
          `${__dirname}/../../../../../test/fixtures/dummy-manuscript-2.pdf`,
        ),
        mimetype: 'application/pdf',
      }
      const manuscript = await Mutation.uploadManuscript(
        {},
        { id, file, fileSize: 73947 },
        { user: profileId },
      )
      expect(manuscript).toMatchObject({
        id,
        meta: {
          title:
            'The Relationship Between Lamport Clocks and Interrupts Using Obi',
        },
        files: [{ filename: 'manuscript.pdf' }],
      })
    })

    it(`fails if manuscript size is bigger than ${config.get(
      'fileUpload.maxSizeMB',
    )}MB`, async () => {
      const blankManuscript = new Manuscript({ createdBy: userId })
      const { id } = await blankManuscript.save()

      const maxFileSize = config.get('fileUpload.maxSizeMB')
      const fileSize = maxFileSize * 1e6 + 1
      const bufferStream = new stream.PassThrough()
      bufferStream.end(Buffer.alloc(fileSize))
      const file = {
        filename: 'manuscript.pdf',
        stream: bufferStream,
        mimetype: 'application/pdf',
      }
      await expect(
        Mutation.uploadManuscript(
          {},
          { id, file, fileSize },
          { user: profileId },
        ),
      ).rejects.toThrow(`File size shouldn't exceed ${maxFileSize}MB`)
    })
  })
})