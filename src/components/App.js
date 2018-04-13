import React from 'react'
import { Link } from 'react-router'
import Post from '../components/Post'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'


const userQuery = gql`
  query {
    user {
      id
      name
    }
  }
`

_isLoggedIn = () => {
  return this.props.data.user
}

_logout = () => {
// in src/components/App.js
//...
// remove token from local storage and reload page to reset apollo client
window.localStorage.removeItem('graphcoolToken')
location.reload()
//...
}

export default graphql(userQuery, { options: {forceFetch: true }})(withRouter(App))
