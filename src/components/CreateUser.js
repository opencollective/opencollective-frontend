import React from 'react'
import { Link } from 'react-router'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

// in src/components/CreateUser.js
const createUser = gql`
  mutation ($email: String!, $password: String!, $name: String!, $emailSubscription: Boolean!) {
    createUser(authProvider: {email: {email: $email, password: $password}}, name: $name, emailSubscription: $emailSubscription) {
      id
    }
  }
`

const signinUser = gql`
  mutation ($email: String!, $password: String!) {
    signinUser(email: {email: $email, password: $password}) {
      token
    }
  }
`

const userQuery = gql`
  query {
    user {
      id
    }
  }
`

export default graphql(createUser, {name: 'createUser'})(
  graphql(userQuery, { options: { forceFetch: true }})(
    graphql(signinUser, {name: 'signinUser'})(
      withRouter(CreateUser))
    )
)

render () {
  if (this.props.data.loading) {
    return (<div>Loading</div>)
  }

  // redirect if user is logged in
  if (this.props.data.user) {
    console.warn('already logged in')
    this.props.router.replace('/')
  }
// ...
}