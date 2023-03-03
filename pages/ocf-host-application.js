import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { CollectiveType, IGNORED_TAGS } from '../lib/constants/collectives';
import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import AboutOurFees from '../components/ocf-host-application/AboutOurFees';
import ApplicationForm from '../components/ocf-host-application/ApplicationForm';
import TermsOfFiscalSponsorship from '../components/ocf-host-application/TermsOfFiscalSponsorship';
import YourInitiativeIsNearlyThere from '../components/ocf-host-application/YourInitiativeIsNearlyThere';
import Page from '../components/Page';
import { TOAST_TYPE, useToasts } from '../components/ToastProvider';
import { withUser } from '../components/UserProvider';

const ocfCollectiveApplicationQuery = gql`
  query OcfCollectiveApplicationPage($slug: String) {
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

const ocfHostApplicationPageQuery = gql`
  query OcfHostApplicationPage {
    account(slug: "foundation") {
      id
      slug
      policies {
        COLLECTIVE_MINIMUM_ADMINS {
          numberOfAdmins
        }
      }
    }
    tagStats(host: { slug: "foundation" }, limit: 6) {
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
    location: '',
    initiativeDuration: '',
    totalAmountRaised: 0,
    totalAmountToBeRaised: 0,
    expectedFundingPartner: '',
    missionImpactExplanation: '',
    websiteAndSocialLinks: '',
  },
  termsOfServiceOC: false,
  inviteMembers: [],
};

const OCFHostApplication = ({ loadingLoggedInUser, LoggedInUser }) => {
  const [checkedTermsOfFiscalSponsorship, setCheckedTermsOfFiscalSponsorship] = useState(false);
  const [initialValues, setInitialValues] = useState(formValues);
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();

  const step = router.query.step || 'intro';
  const collectiveSlug = router.query.collectiveSlug;

  const { data: hostData } = useQuery(ocfHostApplicationPageQuery, {
    context: API_V2_CONTEXT,
  });

  const { data, loading: loadingCollective } = useQuery(ocfCollectiveApplicationQuery, {
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
    <Page title="Open collective foundation application">
      {step === 'intro' && (
        <TermsOfFiscalSponsorship
          checked={checkedTermsOfFiscalSponsorship}
          onChecked={setCheckedTermsOfFiscalSponsorship}
        />
      )}
      {step === 'fees' && <AboutOurFees />}
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
          popularTags={popularTags}
        />
      )}
      {step === 'success' && <YourInitiativeIsNearlyThere />}
    </Page>
  );
};

OCFHostApplication.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
};

export default withUser(OCFHostApplication);
