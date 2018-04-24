const lodash = require('lodash')

const db = require('../db-helpers/')

/**
 * types & input types should be kept in sync
 */
const typeDefs = `
    extend type Query {
      currentSubmission: Manuscript
    }
    extend type Mutation {
      createSubmission: Manuscript!
      updateSubmission(data: ManuscriptInput!): Manuscript!
    }
    type Manuscript {
      id: ID
      title: String
      source: String
      submissionMeta: SubmissionMeta
    }
    input ManuscriptInput {
      id: ID!
      title: String
      source: String
      submissionMeta: SubmissionMetaInput
    }
    type SubmissionMeta {
      coverLetter: String
      author: Person
      correspondent: Person
      createdBy: String
      stage: SubmissionStage
    }
    input SubmissionMetaInput {
      coverLetter: String
      author: PersonInput!
      correspondent: PersonInput
      stage: SubmissionStage!
    }
    type Person {
      firstName: String
      lastName: String
      email: String
      institution: String
    }
    input PersonInput {
      firstName: String
      lastName: String
      email: String
      institution: String
    }
    enum SubmissionStage {
      INITIAL
      QA
    }
`

/**
 * this should be kept in sync with the schema
 */
const emptyManuscript = {
  id: '',
  title: '',
  source: '',
  submissionMeta: {
    coverLetter: '',
    author: {
      firstName: '',
      lastName: '',
      email: '',
      institution: '',
    },
    correspondent: {
      firstName: '',
      lastName: '',
      email: '',
      institution: '',
    },
    stage: 'INITIAL',
  },
}

const resolvers = {
  Query: {
    async currentSubmission(_, vars, ctx) {
      // TODO this will throw an error when you click on submit intially
      const rows = await db.select({
        'submissionMeta.createdBy': ctx.user,
        'submissionMeta.stage': 'INITIAL',
      })

      if (!rows.length) {
        return null
      }

      const manuscript = rows[0].data
      manuscript.id = rows[0].id
      return manuscript
    },
  },
  Mutation: {
    async createSubmission(_, { data }, ctx) {
      // TODO get actual data from orcid
      // const orcidData = db.getOrcidData(ctx.user);
      const orcidData = {
        submissionMeta: {
          author: {
            firstName: 'firstName',
            lastName: 'lastName',
            email: 'email',
            institution: 'institution',
          },
        },
      }
      const manuscript = lodash.merge(emptyManuscript, orcidData)
      const manuscriptDb = db.manuscriptGqlToDb(manuscript, ctx.user)
      const id = await db.save(manuscriptDb)
      manuscript.id = id
      return manuscript
    },
    async updateSubmission(_, { data }, ctx) {
      // check if user is authorized to update manuscript
      const { data: manuscriptDb } = await db.checkPermission(data.id, ctx.user)

      // apply new changes to old manuscript
      const manuscript = db.manuscriptDbToGql(manuscriptDb, data.id)
      const newManuscript = lodash.merge(manuscript, data)

      // update in db
      const newManuscriptDb = db.manuscriptGqlToDb(newManuscript, ctx.user)
      await db.update(newManuscriptDb, data.id)

      // return updated manuscript to user
      return newManuscript
    },
  },
}

module.exports = { typeDefs, resolvers }
