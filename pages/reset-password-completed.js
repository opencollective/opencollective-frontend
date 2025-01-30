import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { LayoutDashboard } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { getI18nLink } from '../components/I18nFormatters';
import Image from '../components/Image';
import Link from '../components/Link';
import Page from '../components/Page';
import { P } from '../components/Text';
import { Button } from '../components/ui/Button';
import { withUser } from '../components/UserProvider';

const ResetPasswordCompleted = ({ LoggedInUser, loadingLoggedInUser }) => {
  return (
    <Page noRobots showFooter={false}>
      <div
        className="flex flex-col items-center px-4 pt-8 pb-32 text-center sm:pt-16"
        data-cy="reset-password-success-page"
      >
        <Image src="/static/images/sign-in-illustration.png" width={624} height={372} />
        <P fontSize="32px" lineHeight="40px" color="black.900" fontWeight={700}>
          <FormattedMessage defaultMessage="Your password was updated." id="GAFyW+" />
        </P>

        {!LoggedInUser && !loadingLoggedInUser && (
          <Fragment>
            <P fontSize="20px" lineHeight="28px" color="black.800" fontWeight={500} mt={4}>
              <FormattedMessage
                defaultMessage="You can now <Link>Sign In</Link> with it."
                id="xXgpav"
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
          </Fragment>
        )}

        {LoggedInUser && (
          <Link href="/dashboard">
            <Button variant="outline" className="mt-6">
              <LayoutDashboard />
              <FormattedMessage defaultMessage="Go to your Dashboard" id="cLaG6g" />
            </Button>
          </Link>
        )}
      </div>
    </Page>
  );
};

ResetPasswordCompleted.propTypes = {
  loadingLoggedInUser: PropTypes.bool.isRequired,
  LoggedInUser: PropTypes.object,
};

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(ResetPasswordCompleted);
