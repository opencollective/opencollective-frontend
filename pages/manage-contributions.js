import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { css } from '@styled-system/css';
import { flatten, groupBy, isEmpty, mapValues, orderBy, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import formatCollectiveType from '../lib/i18n/collective-type';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Avatar from '../components/Avatar';
import CollectiveNavbar from '../components/collective-navbar';
import { Dimensions } from '../components/collective-page/_constants';
import SectionTitle from '../components/collective-page/SectionTitle';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Flex, Grid } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import { manageContributionsQuery } from '../components/recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../components/recurring-contributions/RecurringContributionsContainer';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import StyledHr from '../components/StyledHr';
import { P, Span } from '../components/Text';
import { withUser } from '../components/UserProvider';

const MainContainer = styled(Container)`
  max-width: ${Dimensions.MAX_SECTION_WIDTH}px;
  margin: 0 auto;
`;

const MenuEntry = styled(Link)`
  display: flex;
  align-items: center;
  background: white;
  padding: 8px 12px;
  cursor: pointer;
  background: none;
  color: inherit;
  border: none;
  font: inherit;
  outline: inherit;
  width: 100%;
  text-align: left;
  border-radius: 8px;
  font-size: 13px;

  ${props =>
    props.$isActive &&
    css({
      fontWeight: 800,
      backgroundColor: 'primary.100',
    })}

  &:hover {
    background: #f9f9f9;
  }
`;

class ManageContributionsPage extends React.Component {
  static getInitialProps({ query: { slug } }) {
    return { slug };
  }

  static propTypes = {
    slug: PropTypes.string,
    tab: PropTypes.string,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object,
    }), // from withData
    intl: PropTypes.object,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  componentDidUpdate() {
    const { slug, data, router } = this.props;
    if (data && !data.loading && !data.account && slug?.startsWith('guest-')) {
      // We used to send links like `/guest-12345/recurring-contributions` by email, which caused troubles when updating the slug.
      // This redirect ensures compatibility with old links byt redirecting them to the unified page.
      // See https://github.com/opencollective/opencollective/issues/4876
      router.replace('/manage-contributions');
    }
  }

  getAdministratedAccounts = memoizeOne(loggedInUser => {
    // Personal profile already includes incognito contributions
    const adminMemberships = loggedInUser?.memberOf?.filter(m => m.role === 'ADMIN' && !m.collective.isIncognito);
    const adminAccounts = adminMemberships?.map(m => m.collective) || [];
    const childrenAdminAccounts = flatten(adminAccounts.map(c => c.children));
    const uniqAccounts = uniqBy([...adminAccounts, ...childrenAdminAccounts], 'id');
    const groupedAccounts = groupBy(uniqAccounts, 'type');
    return mapValues(groupedAccounts, accounts => orderBy(accounts, 'name'));
  });

  render() {
    const { slug, data, intl, loadingLoggedInUser, LoggedInUser } = this.props;

    if (!data?.loading && !loadingLoggedInUser && LoggedInUser) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(slug)} log={false} />;
      }
    }

    const collective = data && data.account;
    const canEditCollective = Boolean(LoggedInUser?.isAdminOfCollective(collective));
    const recurringContributions = collective && collective.orders;
    const groupedAdminOf = this.getAdministratedAccounts(LoggedInUser);
    const isAdminOfGroups = !isEmpty(groupedAdminOf);
    const mainGridColumns = isAdminOfGroups ? ['1fr', '250px 1fr'] : ['1fr'];
    return (
      <AuthenticatedPage disableSignup>
        {loadingLoggedInUser || (data?.loading && !isAdminOfGroups) ? (
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        ) : !LoggedInUser || (!data.loading && !canEditCollective) ? (
          <Container p={4}>
            <P p={2} fontSize="16px" textAlign="center">
              <FormattedMessage
                id="RecurringContributions.permissionError"
                defaultMessage="You need to be logged in as the admin of this account to view this page."
              />
            </P>
            {!LoggedInUser && <SignInOrJoinFree />}
          </Container>
        ) : (
          <Container>
            <CollectiveNavbar collective={collective} />
            <MainContainer py={[3, 4]} px={[2, 3, 4]}>
              <SectionTitle textAlign="left" mb={1}>
                <FormattedMessage id="ManageContributions.Title" defaultMessage="Manage contributions" />
              </SectionTitle>
              <Grid gridTemplateColumns={mainGridColumns} gridGap={32} mt={4}>
                {isAdminOfGroups && (
                  <div>
                    <MenuEntry
                      href="/manage-contributions"
                      $isActive={!slug || slug === LoggedInUser.collective.slug}
                      onClick={() => {}}
                    >
                      <Avatar collective={LoggedInUser.collective} size={32} />
                      <Span ml={3}>
                        <FormattedMessage id="ContributionFlow.PersonalProfile" defaultMessage="Personal profile" />
                      </Span>
                    </MenuEntry>
                    {Object.entries(groupedAdminOf).map(([collectiveType, accounts]) => (
                      <div key={collectiveType}>
                        <Flex alignItems="center" px={2} mt={3} mb={2}>
                          <Span fontWeight="bold" color="black.700" fontSize="14px">
                            {formatCollectiveType(intl, collectiveType, 2)}
                          </Span>
                          <StyledHr ml={2} width="100%" borderColor="black.300" />
                        </Flex>
                        {accounts.map(account => (
                          <MenuEntry
                            key={account.id}
                            href={`/${account.slug}/manage-contributions`}
                            title={account.name}
                            $isActive={slug === account.slug}
                          >
                            <Avatar collective={account} size={32} />
                            <Span ml={3} truncateOverflow>
                              {account.name}
                            </Span>
                          </MenuEntry>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                <RecurringContributionsContainer
                  recurringContributions={recurringContributions}
                  account={collective}
                  isLoading={data.loading}
                  displayFilters
                />
              </Grid>
            </MainContainer>
          </Container>
        )}
      </AuthenticatedPage>
    );
  }
}

const addManageContributionsPageData = graphql(manageContributionsQuery, {
  skip: props => !props.LoggedInUser,
  options: props => ({
    context: API_V2_CONTEXT,
    variables: {
      // If slug is passed in the URL (e.g. /facebook/manage-contributions), use it.
      // Otherwise, use the slug of the LoggedInUser.
      slug: props.slug || props.LoggedInUser?.collective?.slug,
    },
  }),
});

export default withRouter(withUser(injectIntl(addManageContributionsPageData(ManageContributionsPage))));
