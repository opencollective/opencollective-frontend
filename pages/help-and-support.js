import React from 'react';
import PropTypes from 'prop-types';
import { Mail } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { getEnvVar } from '@/lib/env-utils';
import { parseToBoolean } from '@/lib/utils';

import { Flex } from '../components/Grid';
import BrowseTopics from '../components/help-and-support/BrowseTopicSection';
import ContactForm from '../components/help-and-support/ContactSection';
import ContactUsSuccess from '../components/help-and-support/ContactUsSuccess';
import HowCanWeHelp from '../components/help-and-support/HowCanWeHelpSection';
import HowOCWorks from '../components/help-and-support/HowOCWorksSection';
import NeedHelp from '../components/help-and-support/NeedHelpSection';
import SearchTopics from '../components/help-and-support/SearchTopicsSection';
import WeAreHereIfYouWantToTalk from '../components/help-and-support/WeAreHereSection';
import Link from '../components/Link';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import StyledLink from '../components/StyledLink';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Help & Support',
    id: 'Uf3+S6',
  },
  defaultTitle: {
    id: 'OC.helpAndSupport',
    defaultMessage: 'How can we help?',
  },
});

const renderFormContent = formConfirmation => {
  if (formConfirmation === 'success') {
    return <ContactUsSuccess />;
  }

  return (
    <React.Fragment>
      <HowCanWeHelp />
      {!parseToBoolean(getEnvVar('DISABLE_CONTACT_FORM')) ? (
        <ContactForm />
      ) : (
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 rounded-xl border p-8 text-center shadow">
          <Mail size={64} className="text-neutral-700" />
          <FormattedMessage
            defaultMessage="Contact us at {email}"
            tagName="div"
            id="64TD/d"
            values={{
              email: <StyledLink href="mailto:support@opencollective.com">support@opencollective.com</StyledLink>,
            }}
          />
        </div>
      )}
      <WeAreHereIfYouWantToTalk />
      <NeedHelp
        title={
          <FormattedMessage id="helpAndSupport.waitForAnswer" defaultMessage="Don’t want to wait for an answer?" />
        }
        description={
          <FormattedMessage
            id="helpAndSupport.waitForAnser.description"
            defaultMessage="Visit our Documentation page to explore topics and find answers to your questions."
          />
        }
        actions={
          <Flex flexDirection={['column', 'row']}>
            <Link href="/help">
              <StyledButton minWidth={208} buttonStyle="marketingSecondary" whiteSpace="nowrap">
                <FormattedMessage id="helpAndSupport.visitHelp" defaultMessage="Visit Help & Support" />
              </StyledButton>
            </Link>
            <StyledLink
              href="https://documentation.opencollective.com"
              buttonSize="medium"
              minWidth={208}
              buttonStyle="marketing"
              mt={['16px', 0]}
              ml={[0, '16px']}
              openInNewTab
            >
              <FormattedMessage id="helpAndSupport.viewDocumentation" defaultMessage="View Documentation" />
            </StyledLink>
          </Flex>
        }
      />
    </React.Fragment>
  );
};

const HelpAndSupport = ({ action, formConfirmation }) => {
  const { formatMessage } = useIntl();

  return (
    <Page description={formatMessage(messages.defaultTitle)}>
      {action === 'contact' ? (
        renderFormContent(formConfirmation)
      ) : (
        <React.Fragment>
          <HowCanWeHelp />
          <SearchTopics />
          <BrowseTopics />
          <HowOCWorks />
          <WeAreHereIfYouWantToTalk />
        </React.Fragment>
      )}
    </Page>
  );
};

HelpAndSupport.propTypes = {
  action: PropTypes.string,
  formConfirmation: PropTypes.string,
};

HelpAndSupport.getInitialProps = async ctx => ({
  ...ctx.query,
});

// next.js export
// ts-unused-exports:disable-next-line
export default HelpAndSupport;
