import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import ApplicationForm from '../components/osc-host-application/ApplicationForm';
import TermsOfFiscalSponsorship from '../components/osc-host-application/TermsOfFiscalSponsorship';
import ConnectGithub from '../components/osc-host-application/ConnectGithub';
import YourInitiativeIsNearlyThere from '../components/osc-host-application/YourInitiativeIsNearlyThere';
import Page from '../components/Page';
import { TOAST_TYPE, useToasts } from '../components/ToastProvider';
import { withUser } from '../components/UserProvider';

const oscCollectiveApplicationQuery = gqlV2/* GraphQL */ `
  query OscCollectiveApplicationPage($slug: String) {
    account(slug: $slug) {
      id
      slug
      description
      name
      type
      isAdmin
      ... on AccountWithHost {
        host {
          id
          name
        }
      }
    }
  }
`;

const oscHostApplicationPageQuery = gqlV2/* GraphQL */ `
  query OscHostApplicationPage {
    account(slug: "opensource") {
      id
      slug
      policies {
        COLLECTIVE_MINIMUM_ADMINS {
          numberOfAdmins
        }
      }
    }
  }
`;

const messages = defineMessages({
  'error.title': {
    id: 'error.title',
    defaultMessage: 'Validation Failed',
  },
  'error.unauthorized.description': {
    id: 'error.unauthorized.description',
    defaultMessage: 'You have to be an admin of {name} to apply with this initiative.',
  },
  'error.existingHost.description': {
    id: 'error.existingHost.description',
    defaultMessage: 'This collective is already hosted by {hostName}.',
  },
});

const formValues = {
  user: {
    name: '',
    email: '',
  },
  collective: {
    name: '',
    slug: '',
    description: '',
  },
  applicationData: {
    githubHandle: '',
  },
  termsOfServiceOC: false,
  inviteMembers: [],
};

const OSCHostApplication = ({ loadingLoggedInUser, LoggedInUser }) => {
  const [checkedTermsOfFiscalSponsorship, setCheckedTermsOfFiscalSponsorship] = useState(false);
  const [githubInfo, setGithubInfo] = useState(null);
  const [initialValues, setInitialValues] = useState(formValues);
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();

  const step = router.query.step || 'intro';
  const collectiveSlug = router.query.collectiveSlug;

  const { data: hostData } = useQuery(oscHostApplicationPageQuery, {
    context: API_V2_CONTEXT,
  });

  const { data, loading: loadingCollective } = useQuery(oscCollectiveApplicationQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: collectiveSlug },
    skip: !(LoggedInUser && collectiveSlug && step === 'form'),
    onError: error => {
      addToast({
        type: TOAST_TYPE.ERROR,
        title: intl.formatMessage(messages['error.title']),
        message: i18nGraphqlException(intl, error),
      });
    },
  });
  const collective = data?.account;
  const canApplyWithCollective = collective && collective.isAdmin && collective.type === CollectiveType.COLLECTIVE;
  const hasHost = collective && collective?.host?.id;

  React.useEffect(() => {
    if (collectiveSlug && collective && (!canApplyWithCollective || hasHost)) {
      addToast({
        type: TOAST_TYPE.ERROR,
        title: intl.formatMessage(messages['error.title']),
        message: hasHost
          ? intl.formatMessage(messages['error.existingHost.description'], {
              hostName: collective.host.name,
            })
          : intl.formatMessage(messages['error.unauthorized.description'], {
              name: collective.name,
            }),
      });
    }
  }, [collectiveSlug, collective]);

  return (
    <Page title="Open Source Collective application">
      {step === 'intro' && (
        <TermsOfFiscalSponsorship
          checked={checkedTermsOfFiscalSponsorship}
          onChecked={setCheckedTermsOfFiscalSponsorship}
        />
      )}
      {step === 'pick-repo' && (
        <ConnectGithub setGithubInfo={info => setGithubInfo(info)} router={router} githubInfo={githubInfo} />
      )}
      {step === 'form' && (
        <ApplicationForm
          initialValues={initialValues}
          setInitialValues={setInitialValues}
          loadingLoggedInUser={loadingLoggedInUser}
          LoggedInUser={LoggedInUser}
          collective={collective}
          host={hostData?.account}
          loadingCollective={loadingCollective}
          canApplyWithCollective={canApplyWithCollective && !hasHost}
          githubInfo={githubInfo}
        />
      )}
      {step === 'success' && <YourInitiativeIsNearlyThere />}
    </Page>
  );
};

OSCHostApplication.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
};

export default withUser(OSCHostApplication);
