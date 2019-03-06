const BaseModel = require('@pubsweet/base-model')

class SemanticExtraction extends BaseModel {
  static get tableName() {
    return 'semantic_extraction'
  }

  static get schema() {
    return {
      required: ['manuscriptId', 'fieldName'],
      properties: {
        manuscriptId: { type: 'uuid' },
        fieldName: { type: 'string' },
        value: { type: 'string' },
      },
    }
  }

  static createTitleEntity(manuscriptId, value) {
    return new SemanticExtraction({
      manuscriptId,
      fieldName: 'title',
      value,
    })
  }

  async delete() {
    throw new Error('Unsupported operation')
  }
}

module.exports = SemanticExtraction
