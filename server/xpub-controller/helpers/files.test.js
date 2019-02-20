const uuid = require('uuid')
const config = require('config')
const FileModel = require('@elifesciences/xpub-model').File
const FilesHelper = require('./files')

const filesHelper = new FilesHelper(config)

describe('FilesHelper', () => {
  describe('validateFileSize', () => {
    const maxSize = config.get('fileUpload.maxSizeMB')
    const invalidFileSize = (maxSize + 1) * 1e6
    const validFileSize = (maxSize - 1) * 1e6

    it('throws an error if the file size is larger than maximum size', () => {
      expect(() => filesHelper.validateFileSize(invalidFileSize)).toThrow(
        `File size shouldn't exceed ${maxSize}MB`,
      )
    })
    it('does not throw if the file size is less than MaxSize', () => {
      expect(() => filesHelper.validateFileSize(validFileSize)).not.toThrow()
    })
  })

  describe('generateFileEntity', () => {
    it('returns the file stream and file entity', async () => {
      const manuscriptId = uuid()
      const file = new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              stream: {},
              filename: 'filename',
              mimetype: 'mimetype',
            }),
          5,
        ),
      )
      const { stream, filename, mimetype: mimeType } = await file
      const fileEntity = await new FileModel({
        manuscriptId,
        url: 'url',
        filename,
        mimeType,
      })
      expect(
        await FilesHelper.generateFileEntity(file, manuscriptId),
      ).toBeCalledWith({
        stream,
        fileEntity,
      })
    })
  })

  describe('publishPredictedProgress', () => {
    const timeData = [
      {
        now: 1550498450221,
        startDate: 1550498450014,
        predictedTime: 5.04049824,
        progress: 4,
      },
      {
        now: 1550498450424,
        startDate: 1550498450014,
        predictedTime: 5.04049824,
        progress: 8,
      },
      {
        now: 1550498450629,
        startDate: 1550498450014,
        predictedTime: 5.04049824,
        progress: 12,
      },
    ]

    const mockTimes = currentTimeData => {
      const mockDate = new Date(currentTimeData.now)
      global.Date = jest.fn(() => mockDate)
      global.Date.now = () => mockDate
    }

    const ON_UPLOAD_PROGRESS = 'ON_UPLOAD_PROGRESS'
    const manuscriptId = '4512fc2f-85bc-4032-97da-c63f8fefec61'

    it('calculates the progress correctly', () => {
      const pubsubMock = expectedProgress => ({
        publish: (param1, param2) => {
          expect(param1).toBe(`${ON_UPLOAD_PROGRESS}.${manuscriptId}`)
          expect(param2.manuscriptUploadProgress).toEqual(expectedProgress)
        },
      })

      // test over differen times to observe the progress is the correct one.
      // | now            |   startdate      |  predictedTime   |   progress
      // | 1550498450221  |  1550498450014   | 5.04049824       |   4
      // | 1550498450424  |  1550498450014   | 5.04049824       |   8
      // | 1550498450629  |  1550498450014   | 5.04049824       |   12

      timeData.forEach(currentTimeData => {
        const originalDate = Date
        mockTimes(currentTimeData)
        const publishPredictedProgress = FilesHelper.publishPredictedProgress(
          pubsubMock(currentTimeData.progress),
          ON_UPLOAD_PROGRESS,
          currentTimeData.startDate,
          currentTimeData.predictedTime,
          manuscriptId,
        )
        publishPredictedProgress()
        global.Date = originalDate
      })
    })

    it('is validated when correct parameters are passed', () => {
      const startedTime = new Date()
      const predictedTime = 3
      const progressFunc = FilesHelper.publishPredictedProgress(
        { publish: () => {} },
        ON_UPLOAD_PROGRESS,
        startedTime,
        predictedTime,
        manuscriptId,
      )
      expect(progressFunc).not.toThrow()
    })

    it('throws an error if called with wrong parameters', () => {
      const startedTime = new Date()
      const predictedTime = 0
      const progressFunc = () =>
        FilesHelper.publishPredictedProgress(
          {},
          ON_UPLOAD_PROGRESS,
          startedTime,
          predictedTime,
          manuscriptId,
        )
      expect(progressFunc).toThrowError(
        new Error('Invalid parameters to calculate the upload file progress.'),
      )
    })
  })
})
