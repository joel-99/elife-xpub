import { ClientFunction } from 'testcafe'
import config from 'config'
import { author, dashboard, wizardStep } from './pageObjects'
import setFixtureHooks from './helpers/set-fixture-hooks'
import NavigationHelper from './helpers/navigationHelper'

const f = fixture('Submission')
setFixtureHooks(f)

test('Interrupt and resume Submission', async t => {
  const navigationHelper = new NavigationHelper(t)

  navigationHelper.login()
  navigationHelper.newSubmission()

  // author details initially empty
  await t
    .expect(author.firstNameField.value)
    .eql('')
    .expect(author.secondNameField.value)
    .eql('')
    .expect(author.emailField.value)
    .eql('')
    .expect(author.institutionField.value)
    .eql('')

  // create a new submission
  await t
    .click(author.orcidPrefill)
    .expect(author.firstNameField.value)
    .eql('Aaron')
    .expect(author.secondNameField.value)
    .eql('Swartz')
    .expect(author.emailField.value)
    .eql('f72c502e0d657f363b5f2dc79dd8ceea')
    .expect(author.institutionField.value)
    .eql('Tech team, University of eLife')
    .selectText(author.emailField)
    .typeText(author.emailField, 'example@example.org')
    .click(wizardStep.next)

  // wait 5 seconds to ensure autosave hasn't interrupted the navigation save
  navigationHelper.wait(5000)

  // navigate back to the dashboard page and continue submission
  await t
    .navigateTo(`${config.get('pubsweet-server.baseUrl')}`)
    .click(dashboard.continueSubmission)

  // get current location and check if it matches whith the last visited one.
  const getLocation = ClientFunction(() => document.location.href)
  await t.expect(getLocation()).contains('/files')
})
