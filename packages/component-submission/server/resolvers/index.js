const config = require('config')
const logger = require('@pubsweet/logger')
const User = require('@elifesciences/component-model-user').model
const ManuscriptModel = require('@elifesciences/component-model-manuscript')
  .model
const FileModel = require('@elifesciences/component-model-file').model
const TeamModel = require('@elifesciences/component-model-team').model
const { S3Storage } = require('@elifesciences/component-service-s3')
const elifeApi = require('@elifesciences/component-model-user/entities/user/helpers/elife-api')
const {
  getPubsub,
  asyncIterators,
} = require('pubsweet-server/src/graphql/pubsub')

const removeUploadedManuscript = require('./removeUploadedManuscript')
const submitManuscript = require('./submitManuscript')
const uploadManuscript = require('./uploadManuscript')
const uploadSupportingFile = require('./uploadSupportingFile')
const removeSupportingFiles = require('./removeSupportingFiles')

const {
  Manuscript,
  getSubmissionUseCase,
  updateSubmissionUseCase,
} = require('../use-cases')
const { Submission } = require('../aggregates')

const { ON_UPLOAD_PROGRESS } = asyncIterators

const resolvers = {
  Query: {
    async manuscript(_, { id }, { user }) {
      const userUuid = await User.getUuidForProfile(user)
      const submission = new Submission({
        models: {
          Manuscript: ManuscriptModel,
          File: FileModel,
          Team: TeamModel,
        },
        services: {
          Storage: S3Storage,
        },
      })

      return getSubmissionUseCase
        .initialize({ submission })
        .execute(id, userUuid)
    },
    async editors(_, { role }) {
      return elifeApi.people(role)
    },
  },

  Mutation: {
    async updateManuscript(_, { data }, { user }) {
      const userUuid = await User.getUuidForProfile(user)
      const submission = new Submission({
        models: {
          Manuscript: ManuscriptModel,
          File: FileModel,
          Team: TeamModel,
        },
        services: {
          Storage: S3Storage,
        },
      })

      return updateSubmissionUseCase
        .initialize({ submission })
        .execute(data.id, userUuid)
    },
    // updateManuscript,

    submitManuscript,

    uploadManuscript,

    uploadSupportingFile,

    removeUploadedManuscript,

    removeSupportingFiles,

    async savePage(_, vars, { user }) {
      const userUuid = await User.getUuidForProfile(user)
      const manuscriptModel = await ManuscriptModel.find(vars.id, userUuid)
      const manuscript = new Manuscript(config, userUuid, S3Storage)

      manuscriptModel.lastStepVisited = vars.url
      await manuscriptModel.save()
      logger.debug(`Updated manuscript`, {
        manuscriptId: vars.id,
        userId: userUuid,
        lastStepVisited: vars.url,
      })

      return manuscript.getView(vars.id)
    },
  },

  Subscription: {
    manuscriptUploadProgress: {
      subscribe: async (_, vars, context) => {
        const pubsub = await getPubsub()
        return pubsub.asyncIterator(`${ON_UPLOAD_PROGRESS}.${vars.id}`)
      },
    },
  },

  Manuscript: {
    async author(manuscript) {
      const team = manuscript.teams.find(t => t.role === 'author')
      if (!team) return { firstName: '', lastName: '', email: '', aff: '' }
      return team.teamMembers[0].alias
    },

    async clientStatus(manuscript) {
      let clientStatus = ''

      switch (manuscript.status) {
        case 'INITIAL':
          clientStatus = 'CONTINUE_SUBMISSION'
          break
        case 'MECA_EXPORT_PENDING':
        case 'MECA_EXPORT_FAILED':
        case 'MECA_EXPORT_SUCCEEDED':
        case 'MECA_IMPORT_FAILED':
        case 'MECA_IMPORT_SUCCEEDED':
          clientStatus = 'SUBMITTED'
          break
        default:
          throw new Error(`Unhandled manuscript status ${manuscript.status}`)
      }

      return clientStatus
    },

    async assignees(manuscript, { role }) {
      const team = manuscript.teams.find(t => t.role === role)
      if (!team) return []

      switch (role) {
        case 'suggestedSeniorEditor':
        case 'opposedSeniorEditor':
        case 'suggestedReviewingEditor':
        case 'opposedReviewingEditor': {
          const assigneeIds = team.teamMembers.map(
            member => member.meta.elifePersonId,
          )
          return elifeApi.getEditorsByPersonId(assigneeIds)
        }
        case 'suggestedReviewer':
        case 'opposedReviewer':
          return team.teamMembers.map(member => member.meta)

        default:
          throw new Error(`Unhandled role type ${role}`)
      }
    },
  },

  Assignee: {
    __resolveType: assignee => {
      if (assignee.focuses !== undefined || assignee.expertises !== undefined)
        return 'EditorAlias'
      if (assignee.name !== undefined || assignee.email !== undefined)
        return 'ReviewerAlias'
      if (assignee.firstName !== undefined) return 'AuthorAlias'
      return null
    },
  },
}

module.exports = resolvers
