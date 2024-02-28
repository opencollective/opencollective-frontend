import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import { Box } from '../components/Grid';
import { getI18nLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import OpenEmailProviderButton from '../components/OpenEmailProviderButton';
import Page from '../components/Page';
import { P } from '../components/Text';

class SignInLinkSent extends Component {
  static async getInitialProps({ res, query = {}, router }) {
    if (query.email) {
      return { email: query.email };
    }

    if (res) {
      res.statusCode = 302;
      res.setHeader('Location', '/signin');
      res.end();
    } else {
      router.push('/signin');
    }
    return {};
  }

  render() {
    const { email } = this.props;
    const isValidEmail = email && isEmail(email);
    return (
      <Page title="Login Link Sent" noRobots showFooter={false}>
        <div className="flex flex-col items-center px-4 pb-32 pt-8 text-center sm:pt-16">
          <Image src="/static/images/sign-in-illustration.png" width={624} height={372} />
          <P fontSize="32px" lineHeight="40px" fontWeight={700} color="black.900">
            <FormattedMessage id="SignIn.LinkSent" defaultMessage="Your magic link is on its way!" />
          </P>
          {isValidEmail && (
            <P fontSize="20px" lineHeight="28px" color="black.800" fontWeight={500} mt={4}>
              <FormattedMessage
                defaultMessage="We've sent it to {email}"
                values={{ email: <strong>{email}</strong> }}
              />
            </P>
          )}
          <OpenEmailProviderButton email={email}>{button => <Box mt={3}>{button}</Box>}</OpenEmailProviderButton>
          <P color="black.800" fontSize="16px" fontWeight={500} lineHeight="24px" my={4}>
            <FormattedMessage
              id="SignIn.SuccessDetails"
              defaultMessage="You’ll be redirected from the link in the email, you can safely close this tab."
            />
            <br />
            <FormattedMessage
              id="signinLinkSent."
              defaultMessage="<Link>Learn more</Link> about our login system."
              values={{
                Link: getI18nLink({
                  href: 'https://docs.opencollective.com/help/product/log-in-system',
                  openInNewTab: true,
                }),
              }}
            />
          </P>
        </div>
      </Page>
    );
  }
}

SignInLinkSent.propTypes = {
  email: PropTypes.string.isRequired,
};

// ignore unused exports default
// next.js export
export default SignInLinkSent;
