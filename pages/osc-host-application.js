import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { CollectiveType, IGNORED_TAGS } from '../lib/constants/collectives';
import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import ApplicationForm from '../components/osc-host-application/ApplicationForm';
import ConnectGithub from '../components/osc-host-application/ConnectGithub';
import TermsOfFiscalSponsorship from '../components/osc-host-application/TermsOfFiscalSponsorship';
import YourInitiativeIsNearlyThere from '../components/osc-host-application/YourInitiativeIsNearlyThere';
import Page from '../components/Page';
import { TOAST_TYPE, useToasts } from '../components/ToastProvider';
import { withUser } from '../components/UserProvider';

const oscCollectiveApplicationQuery = gql`
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

const oscHostApplicationPageQuery = gql`
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
    tagStats(host: { slug: "opensource" }, limit: 6) {
      nodes {
        id
        tag
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
    tags: [],
  },
  applicationData: {
    typeOfProject: null,
    repositoryUrl: '',
    licenseSpdxId: null,
    extraLicenseInfo: '',
    amountOfMembers: '',
    linksToPreviousEvents: '',
  },
  termsOfServiceOC: false,
  inviteMembers: [],
};

const formatNameFromSlug = repoName => {
  // replaces dash and underscore with space, then capitalises the words
  return repoName.replace(/[-_]/g, ' ').replace(/(?:^|\s)\S/g, words => words.toUpperCase());
};

const OSCHostApplication = ({ loadingLoggedInUser, LoggedInUser, refetchLoggedInUser }) => {
  const [checkedTermsOfFiscalSponsorship, setCheckedTermsOfFiscalSponsorship] = useState(false);
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
  const popularTags = hostData?.tagStats.nodes.map(({ tag }) => tag).filter(tag => !IGNORED_TAGS.includes(tag));

  React.useEffect(() => {
    if (step === 'form' && collectiveSlug && collective && (!canApplyWithCollective || hasHost)) {
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
        <ConnectGithub
          setGithubInfo={({ handle, licenseSpdxId } = {}) => {
            const [owner, repo] = handle?.split('/') || [];

            setInitialValues({
              ...initialValues,
              collective: {
                ...initialValues.collective,
                name: handle ? formatNameFromSlug(repo ?? owner) : '',
                slug: handle ? repo ?? owner : '',
              },
              applicationData: {
                ...initialValues.applicationData,
                typeOfProject: handle ? 'CODE' : null,
                repositoryUrl: handle ? `https://github.com/${handle}` : '',
                licenseSpdxId,
                useGithubValidation: true,
              },
            });
          }}
          router={router}
          nextDisabled={!initialValues.applicationData.repositoryUrl}
        />
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
          refetchLoggedInUser={refetchLoggedInUser}
          popularTags={popularTags}
        />
      )}
      {step === 'success' && <YourInitiativeIsNearlyThere />}
    </Page>
  );
};

OSCHostApplication.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
  refetchLoggedInUser: PropTypes.func,
};

export default withUser(OSCHostApplication);
