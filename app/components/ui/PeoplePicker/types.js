import PropTypes from 'prop-types'

export const personIdPropType = PropTypes.oneOfType([
  PropTypes.number,
  PropTypes.string,
])

export const personNamePropType = PropTypes.string

export const affiliationPropType = PropTypes.string

export const affiliationsPropType = PropTypes.arrayOf(affiliationPropType)

export const expertisesPropType = PropTypes.arrayOf(PropTypes.string.isRequired)

export const focusesPropType = PropTypes.arrayOf(PropTypes.string.isRequired)

export const personPropType = PropTypes.shape({
  id: personIdPropType.isRequired,
  name: personNamePropType.isRequired,
  aff: affiliationsPropType,
  expertises: expertisesPropType,
  focuses: focusesPropType,
})

export const peoplePropType = PropTypes.arrayOf(personPropType.isRequired)