import { gql } from '@apollo/client';
import NextAuth from 'next-auth';

function queryToString(query) {
  return query.loc?.source.body.replace(/\s+/g, ' ').trim();
}

const loggedInUserQuery = gql`
  query OAuthLoggedInUser {
    me {
      id
      name
      email
      imageUrl(height: 90)
      type
    }
  }
`;

const oAuthUrl = process.env.OPENCOLLECTIVE_OAUTH_URL || 'https://opencollective.com';
const oAuthScopes = process.env.OPENCOLLECTIVE_OAUTH_SCOPES || 'email';

// console.log({
//   id: 'opencollective',
//   name: 'Open Collective',
//   type: 'oauth',
//   authorization: `${oAuthUrl}/oauth/authorize?scope=${oAuthScopes}`,
//   token: `${process.env.API_URL}/oauth/token`,
//   userinfo: {
//     url: `${process.env.API_URL}/graphql`,
//     params: { query: queryToString(loggedInUserQuery) },
//   },
//   options: {
//     clientId: process.env.OPENCOLLECTIVE_OAUTH_APP_ID,
//     clientSecret: process.env.OPENCOLLECTIVE_OAUTH_APP_SECRET,
//   },
// });

export default NextAuth({
  providers: [
    {
      id: 'opencollective',
      name: 'Open Collective',
      type: 'oauth',
      authorization: `${oAuthUrl}/oauth/authorize?scope=${oAuthScopes}`,
      token: `${process.env.API_URL}/oauth/token`,
      userinfo: {
        url: `${process.env.API_URL}/graphql`,
        params: { query: queryToString(loggedInUserQuery) },
      },
      profile(result) {
        return {
          id: result.data.me.id,
          email: result.data.me.email,
          image: result.data.me.imageUrl,
          name: result.data.me.name,
        };
      },
      options: {
        clientId: process.env.OPENCOLLECTIVE_OAUTH_APP_ID,
        clientSecret: process.env.OPENCOLLECTIVE_OAUTH_APP_SECRET,
      },
    },
  ],
  theme: {
    colorScheme: 'light',
  },
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
