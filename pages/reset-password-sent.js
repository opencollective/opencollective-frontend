import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import Container from '../components/Container';
import { Box } from '../components/Grid';
import { getI18nLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import OpenEmailProviderButton from '../components/OpenEmailProviderButton';
import Page from '../components/Page';
import { P } from '../components/Text';

class ResetPasswordSent extends Component {
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
      <Page noRobots showFooter={false}>
        <Container pt={[4, 5]} pb={6} px={3} textAlign="center">
          <Image src="/static/images/sign-in-illustration.png" width={624} height={372} />
          <P fontSize="32px" lineHeight="40px" color="black.900" fontWeight={700}>
            <FormattedMessage defaultMessage="Your reset password email is on its way." />
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
          <P fontSize="16px" lineHeight="24px" color="black.800" fontWeight={500} my={4}>
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
        </Container>
      </Page>
    );
  }
}

ResetPasswordSent.propTypes = {
  email: PropTypes.string.isRequired,
};

export default ResetPasswordSent;
