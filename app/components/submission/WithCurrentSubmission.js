import gql from 'graphql-tag'
import { withApollo, Mutation } from 'react-apollo'
import React from 'react'

export const GET_CURRENT_SUBMISSION = gql`
  query CurrentSubmission {
    currentSubmission {
      id
      title
      source
      submissionMeta {
        coverLetter
        author {
          firstName
          lastName
          email
          institution
        }
        displayCorrespondent
        correspondent {
          firstName
          lastName
          email
          institution
        }
        stage
      }
    }
  }
`

const CREATE_SUBMISSION = gql`
  mutation CreateSubmission {
    createSubmission {
      id
      title
      source
      submissionMeta {
        coverLetter
        author {
          firstName
          lastName
          email
          institution
        }
        displayCorrespondent
        correspondent {
          firstName
          lastName
          email
          institution
        }
        stage
      }
    }
  }
`

const UPDATE_SUBMISSION = gql`
  mutation UpdateSubmission($data: ManuscriptInput!) {
    updateSubmission(data: $data) {
      id
      title
      submissionMeta {
        author {
          firstName
          lastName
          email
          institution
        }
        displayCorrespondent
        correspondent {
          firstName
          lastName
          email
          institution
        }
      }
    }
  }
`

class WithCurrentSubmission extends React.Component {
  constructor() {
    super()
    this.state = { error: null, data: null, loading: true }
  }
  componentDidMount() {
    this.props.client
      .query({ query: GET_CURRENT_SUBMISSION })
      .then(({ data }) => {
        if (data.currentSubmission) {
          return this.setState({ data, error: null, loading: false })
        }
        return this.props.client
          .mutate({ mutation: CREATE_SUBMISSION })
          .then(({ data: createData }) => {
            this.setState({
              data: createData,
              error: undefined,
              loading: false,
            })
          })
      })
      .catch(error => this.setState({ error, data: null, loading: false }))
  }
  render() {
    const { loading, error, data } = this.state

    const initialValues =
      data && (data.currentSubmission || data.createSubmission)

    if (loading) {
      return <div>Loading...</div>
    }

    if (error) {
      return <div>{error.message}</div>
    }

    return (
      <Mutation mutation={UPDATE_SUBMISSION}>
        {(updateSubmission, updateResult) =>
          this.props.children(updateSubmission, updateResult, initialValues)
        }
      </Mutation>
    )
  }
}

export default withApollo(WithCurrentSubmission)
