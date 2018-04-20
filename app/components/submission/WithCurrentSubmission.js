import gql from 'graphql-tag'
import { Query, Mutation } from 'react-apollo'
import React from 'react'

export const GET_CURRENT_SUBMISSION = gql`
  query CurrentSubmission {
    currentSubmission {
      id
      title
      source
    }
  }
`

const CREATE_SUBMISSION = gql`
  mutation CreateSubmission {
    createSubmission {
      id
    }
  }
`

class CreateSubmissionWrapper extends React.Component {
  componentDidMount() {
    this.props.createSubmission()
  }
  render() {
    return this.props.children(this.props.data)
  }
}

const WithCurrentSubmission = ({ children }) => (
  <Query query={GET_CURRENT_SUBMISSION}>
    {({ loading, error, data }) => {
      if (loading) return <div>Loading...</div>

      if (error) {
        return <div>{error.message}</div>
      }

      if (!data.currentSubmission.id) {
        return (
          <Mutation mutation={CREATE_SUBMISSION}>
            {(createSubmission, mutationData) => (
              <CreateSubmissionWrapper
                createSubmission={createSubmission}
                data={mutationData}
              >
                {children}
              </CreateSubmissionWrapper>
            )}
          </Mutation>
        )
        // create submission
      }
      return children(data)
    }}
  </Query>
)

export default WithCurrentSubmission
