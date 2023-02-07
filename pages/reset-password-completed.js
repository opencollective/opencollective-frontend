import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../components/Container';
import { getI18nLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import Page from '../components/Page';
import { P } from '../components/Text';

const ResetPasswordCompleted = () => {
  return (
    <Page noRobots showFooter={false}>
      <Container pt={[4, 5]} pb={6} px={3} textAlign="center">
        <Image src="/static/images/sign-in-illustration.png" width="624px" height="372px" />
        <P fontSize="32px" lineHeight="40px" color="black.900" fontWeight={700}>
          <FormattedMessage defaultMessage="Your password was updated." />
        </P>
        <P fontSize="20px" lineHeight="28px" color="black.800" fontWeight={500} mt={4}>
          <FormattedMessage
            defaultMessage="You can now <Link>Sign In</Link> with it."
            values={{
              Link: getI18nLink({
                href: '/signin',
              }),
            }}
          />
        </P>
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
};

export default ResetPasswordCompleted;
