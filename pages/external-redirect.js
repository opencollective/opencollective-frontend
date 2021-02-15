import React from 'react';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { isURL } from 'validator';

import Container from '../components/Container';
import { Flex } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import StyledHr from '../components/StyledHr';
import { H3, P, Span, Strong } from '../components/Text';

// Make sure fallback is an internal link
const getFallback = fallback => {
  if (!fallback || fallback[0] !== '/') {
    return '/';
  } else {
    return fallback;
  }
};

export const isValidExternalRedirect = url => {
  const validationParams = process.env.NODE_ENV === 'production' ? {} : { require_tld: false }; // eslint-disable-line camelcase
  return url && isURL(url, validationParams);
};

/**
 * A page to use whenever you need to redirect to a page that may be external to Open Collective.
 * The page displays a confirmation to make sure that user is aware of being redirected, to prevent
 * phishing attacks.
 */
const ExternalRedirectPage = () => {
  const router = useRouter();
  const [isReady, setReady] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState(false);
  const query = router?.query || {};
  const fallback = getFallback(query.fallback);

  React.useEffect(() => {
    if (router && !query.url) {
      router.push(fallback);
    } else if (!isValidExternalRedirect(query.url)) {
      router.push(query.url[0] === '/' ? query.url : fallback);
    } else {
      setReady(true);
    }
  }, [router, query]);

  return (
    <Page>
      <Flex justifyContent="center" alignItems="center" py={[4, 5, 6]}>
        {isReady ? (
          <StyledCard maxWidth={450}>
            <Container p={3}>
              <H3 fontSize="16px" lineHeight="15px" fontWeight="bold" my={2}>
                <ExclamationTriangle data-type="message-icon" size="1em" color="#CCCC18" />
                <Span ml={2} css={{ verticalAlign: 'middle' }}>
                  <FormattedMessage id="PleaseBeCareful" defaultMessage="Please be careful" />
                </Span>
              </H3>
              <StyledHr my={2} borderColor="black.300" />
              <P fontSize="14px" lineHeight="20px" my={3}>
                <FormattedMessage
                  id="externalRedirect.message"
                  defaultMessage="Your request is currently being redirected to {redirect}. For the safety and privacy of your Open Collective account, remember to never enter your credentials unless you're on the real Open Collective website."
                  values={{ redirect: <Strong wordBreak="break-all">{query.url}</Strong> }}
                />
              </P>
            </Container>
            <Container display="flex" justifyContent="flex-end" backgroundColor="black.100" p={1}>
              <a href={query.url} onClick={() => setPendingAction('REDIRECT')}>
                <StyledButton
                  buttonSize="small"
                  my={2}
                  minWidth={140}
                  buttonStyle="primary"
                  loading={pendingAction === 'REDIRECT'}
                  disabled={pendingAction}
                >
                  <FormattedMessage id="actions.continue" defaultMessage="Continue" />
                </StyledButton>
              </a>
              <Link href={`/${fallback}`} onClick={() => setPendingAction('CANCEL')}>
                <StyledButton
                  buttonSize="small"
                  m={2}
                  minWidth={140}
                  data-cy="confirmation-modal-cancel"
                  loading={pendingAction === 'CANCEL'}
                  disabled={pendingAction}
                >
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </StyledButton>
              </Link>
            </Container>
          </StyledCard>
        ) : (
          <Loading />
        )}
      </Flex>
    </Page>
  );
};

export default ExternalRedirectPage;
