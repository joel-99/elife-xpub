import React from 'react'
import styled from 'styled-components'
import { Field } from 'formik'
import { get } from 'lodash'
import { TextField, th } from '@pubsweet/ui'

const MessageWrapper = styled.div`
  // consistent height even when empty
  min-height: ${th('fontLineHeight')};
  // inverse of bottom margin on FieldComponent
  margin-top: -${th('gridUnit')};
`

const ErrorMessage = styled.div`
  color: ${th('colorError')};
`

export default ({ name, component: FieldComponent = TextField, ...props }) => {
  const render = ({ field, form }) => {
    const touched = get(form.touched, name)
    const errors = get(form.errors, name)

    let validationStatus
    if (touched) validationStatus = 'success'
    if (touched && errors) validationStatus = 'error'

    return (
      <React.Fragment>
        <FieldComponent
          validationStatus={validationStatus}
          {...field}
          {...props}
        />

        {/* live region DOM node must be initially present for changes to be announced */}
        <MessageWrapper role="alert">
          {touched && errors && <ErrorMessage>{errors}</ErrorMessage>}
        </MessageWrapper>
      </React.Fragment>
    )
  }

  return <Field name={name} render={render} />
}
