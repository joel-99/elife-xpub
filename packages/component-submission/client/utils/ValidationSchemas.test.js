import * as yup from 'yup'
import { yupToFormErrors } from 'formik'

import { disclosureSchema, editorsSchema } from './ValidationSchemas'

describe('Editors Schema', () => {
  const schema = yup.object().shape(editorsSchema)
  it('allows valid data', () => {
    const validData = {
      suggestedSeniorEditors: [{ id: 1 }, { id: 2 }],
      opposedSeniorEditors: [],
      opposedSeniorEditorsReason: '',
      suggestedReviewingEditors: [{ id: 1 }, { id: 2 }],
      opposedReviewingEditors: [{ id: 3 }],
      opposedReviewingEditorsReason: 'Just because',
      suggestedReviewers: [
        { name: 'A', email: 'a@here.com' },
        { name: 'B', email: 'b@here.com' },
        { name: 'C', email: 'c@here.com' },
      ],
      opposedReviewers: [
        { name: 'D', email: 'd@here.com' },
        { name: 'E', email: 'e@here.com' },
      ],
      opposedReviewersReason: 'Some conflict',
    }

    expect(() => schema.validateSync(validData)).not.toThrow()
  })

  it('stops invalid data', () => {
    const invalidData = {
      suggestedSeniorEditors: [{ id: 1 }],
      opposedSeniorEditors: [{ id: 2 }],
      opposedSeniorEditorsReason: '',
      suggestedReviewingEditors: [],
      opposedReviewingEditors: [{ id: 1 }, { id: 2 }, { id: 3 }],
      opposedReviewingEditorsReason: '',
      suggestedReviewers: [{ name: '', email: 'bloop' }],
      opposedReviewers: [{ name: 'Jane Doe', email: 'jane@doe.com' }],
      opposedReviewersReason: '',
    }

    let errors = 'chickens'
    try {
      schema.validateSync(invalidData, { abortEarly: false })
    } catch (e) {
      errors = yupToFormErrors(e)
    }

    expect(errors).toEqual({
      opposedReviewingEditors: 'Please suggest no more than 2 editors',
      opposedReviewingEditorsReason: 'Please provide a reason for exclusion',
      opposedSeniorEditorsReason: 'Please provide a reason for exclusion',
      suggestedReviewers: [
        { email: 'Must be a valid email', name: 'Name is required' },
      ],
      suggestedReviewingEditors: 'Please suggest at least 2 editors',
      suggestedSeniorEditors: 'Please suggest at least 2 editors',
      opposedReviewersReason: 'Please provide a reason for exclusion',
    })
  })
})

describe('Disclosure Schema', () => {
  const schema = yup.object().shape(disclosureSchema)
  it('allows valid data', () => {
    const validData = {
      submitterSignature: 'Jo Franchetti',
      disclosureConsent: true,
    }
    expect(() => schema.validateSync(validData)).not.toThrow()
  })

  it('registers empty name as invalid', () => {
    const invalidData = {
      submitterSignature: '',
      disclosureConsent: true,
    }

    let errors
    try {
      schema.validateSync(invalidData, { abortEarly: false })
    } catch (e) {
      errors = yupToFormErrors(e)
    }

    expect(errors).toEqual({ submitterSignature: 'Your name is required' })
  })

  it('registers an unchecked consent box as invalid', () => {
    const invalidData = {
      submitterSignature: 'Jo Franchetti',
      disclosureConsent: false,
    }

    let errors
    try {
      schema.validateSync(invalidData, { abortEarly: false })
    } catch (e) {
      errors = yupToFormErrors(e)
    }

    expect(errors).toEqual({
      disclosureConsent: 'We are unable to proceed without your consent',
    })
  })
})