import React from 'react'
import styled from 'styled-components'
import { Formik } from 'formik'
import { Box, Flex } from 'grid-styled'
import { Button } from '@pubsweet/ui'
import ButtonLink from '../../ui/atoms/ButtonLink'
import { FormH2 } from '../../ui/atoms/FormHeadings'
import AutoSave from './AutoSave'
import ProgressBar from './ProgressBar'
import WizardSubmit from './WizardSubmit'

const BoxNoMinWidth = styled(Box)`
  min-width: 0;
`

const WizardStep = ({
  component: FormComponent,
  finalStep,
  handleAutoSave,
  handleButtonClick,
  history,
  nextUrl,
  previousUrl,
  initialValues,
  title,
  step,
  validationSchema,
}) => (
  <Formik
    initialValues={initialValues}
    // ensure each page gets a new form instance otherwise all fields are touched
    key={FormComponent.name}
    onSubmit={values => {
      handleButtonClick(values).then(() => history.push(nextUrl))
    }}
    render={({
      values,
      handleSubmit,
      setTouched,
      submitForm,
      validateForm,
      ...formProps
    }) => (
      <Flex>
        <BoxNoMinWidth flex="1 1 auto" mx={[0, 0, 0, '16.666%']}>
          <form noValidate onSubmit={handleSubmit}>
            <AutoSave onSave={handleAutoSave} values={values} />
            <Box my={5}>
              <ProgressBar currentStep={step} />
            </Box>

            <FormH2>{title}</FormH2>

            <FormComponent values={values} {...formProps} />

            <Flex mt={6}>
              {previousUrl && (
                <Box mr={3}>
                  <ButtonLink data-test-id="back" to={previousUrl}>
                    Back
                  </ButtonLink>
                </Box>
              )}
              <Box>
                {finalStep ? (
                  <WizardSubmit
                    setTouched={setTouched}
                    submitForm={submitForm}
                    validateForm={validateForm}
                  />
                ) : (
                  <Button data-test-id="next" primary type="submit">
                    Next
                  </Button>
                )}
              </Box>
            </Flex>
          </form>
        </BoxNoMinWidth>
      </Flex>
    )}
    validationSchema={validationSchema}
  />
)

export default WizardStep
