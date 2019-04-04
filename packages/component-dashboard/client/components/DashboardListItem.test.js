import React from 'react'
import { shallow } from 'enzyme'
import { subDays } from 'date-fns'

import DashboardListItem, {
  dashboardDateText,
  DashboardListItemContent,
} from './DashboardListItem'
import ManuscriptStatus from './ManuscriptStatus'

describe('DashboardListItem', () => {
  describe('dashboardDateText', () => {
    it('show invalid for future date', () => {
      expectText(-1, 'Invalid date')
    })
    it('handles bad argument', () => {
      const value = dashboardDateText(Object())
      expect(value).toBe('Invalid date')
    })
    it('shows correct text', () => {
      expectText(0, 'Today')
      expectText(1, 'Yesterday')
      expectText(2, '2 days ago')
      expectText(6, '6 days ago')
      expectText(13, '13 days ago')
      expectText(14, '2 weeks ago')
      expectText(29, '4 weeks ago')
      expectText(30, '1 month ago')
      expectText(44, '1 month ago')
      expectText(45, '2 months ago')
      expectText(364, '12 months ago')
      expectText(729, '24 months ago')
      expectText(730, '2 years ago')
      expectText(1460, '4 years ago')
    })
  })

  describe('DashboardListItemContent', () => {
    it('renders title, status and updated date of passed manuscript', () => {
      const dummyManuscript = {
        meta: {
          title: 'MockTitle',
        },
        clientStatus: 'CONTINUE_SUBMISSION',
        updated: '2019-04-03T15:24:07.190Z',
      }
      const wrapper = shallow(
        <DashboardListItemContent
          manuscript={dummyManuscript}
          title={dummyManuscript.meta.title}
        />,
      )

      expect(wrapper.text()).toContain('MockTitle')
      expect(wrapper.text()).toContain('Wed 3 Apr 2019')
      expect(wrapper.find(ManuscriptStatus)).toHaveLength(1)
    })
  })

  describe('DashboardListItem', () => {
    it('renders a modal wrapped component when status is not SUBMITTED', () => {
      const dummyManuscript = {
        meta: {
          title: 'MockTitle',
        },
        clientStatus: 'CONTINUE_SUBMISSION',
        updated: '2019-04-03T15:24:07.190Z',
      }
      const wrapper = shallow(
        <DashboardListItem manuscript={dummyManuscript} onDelete={() => {}} />,
      )

      expect(wrapper.find('ModalHistoryState')).toHaveLength(1)
    })
    it('renders item without modal wrapper when status is SUBMITTED', () => {
      const dummyManuscript = {
        meta: {
          title: 'MockTitle',
        },
        clientStatus: 'SUBMITTED',
        updated: '2019-04-03T15:24:07.190Z',
      }
      const wrapper = shallow(
        <DashboardListItem manuscript={dummyManuscript} onDelete={() => {}} />,
      )

      expect(wrapper.find('ModalHistoryState')).toHaveLength(0)
    })
  })
})

function expectText(daysAgo, expectedText) {
  const value = dashboardDateText(subDays(new Date(), daysAgo))
  expect(value).toBe(expectedText)
}
