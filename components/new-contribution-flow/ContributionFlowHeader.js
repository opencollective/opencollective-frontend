import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { first } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import Avatar, { ContributorAvatar } from '../../components/Avatar';
import Container from '../../components/Container';
import FormattedMoneyAmount from '../../components/FormattedMoneyAmount';
import { Box, Flex } from '../../components/Grid';
import Link from '../../components/Link';
import { H3, P } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

const MAX_CONTRIBUTORS_TO_DISPLAY = 10;

class NewContributionFlowHeader extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
  };

  render() {
    const { collective, LoggedInUser } = this.props;

    const contributors = collective && collective.members.nodes;
    const loggedInUserIsContributor =
      LoggedInUser &&
      first(contributors?.filter(contributor => contributor.account.slug === LoggedInUser.collective.slug));
    const loggedInUserTotalDonations =
      loggedInUserIsContributor && first(loggedInUserIsContributor.account.orders.nodes).totalDonations.value;

    return (
      <Flex flexDirection="column" alignItems="center" maxWidth={500}>
        <Avatar collective={collective} radius={65} />
        <H3 textAlign="center" fontWeight={500} py={2}>
          <FormattedMessage
            id="CreateOrder.Title"
            defaultMessage="Contribute to {collective}"
            values={{ collective: collective.name }}
          />
        </H3>
        {loggedInUserIsContributor ? (
          <P py={2}>
            <FormattedMessage
              id="NewContributionFlow.ContributedSoFar"
              defaultMessage="You have contributed {amount} to {collective} so far. Keep it going!"
              values={{
                collective: collective.name,
                amount: (
                  <FormattedMoneyAmount
                    precision={2}
                    amount={loggedInUserTotalDonations * 100}
                    currency={collective.currency}
                    amountStyles={{ fontWeight: 'bold', color: 'black.900' }}
                  />
                ),
              }}
            />
          </P>
        ) : (
          <Fragment>
            {contributors && contributors.length > 0 && (
              <Fragment>
                <P fontSize="LeadParagraph" fontWeight={400} color="black.500" py={2}>
                  <FormattedMessage
                    id="NewContributionFlow.Join"
                    defaultMessage="Join {numberOfContributors} other fellow contributors"
                    values={{ numberOfContributors: contributors.length }}
                  />
                </P>
                <Flex py={2}>
                  {contributors.slice(0, MAX_CONTRIBUTORS_TO_DISPLAY).map(contributor => (
                    <Box key={contributor.account.id} mx={1}>
                      {contributor.account.slug ? (
                        <Link
                          route="collective"
                          params={{ slug: contributor.account.slug }}
                          title={contributor.account.name}
                        >
                          <ContributorAvatar contributor={contributor.account} radius={24} />
                        </Link>
                      ) : (
                        <ContributorAvatar
                          contributor={contributor.account}
                          radius={24}
                          title={contributor.account.name}
                        />
                      )}
                    </Box>
                  ))}
                  {contributors.length > MAX_CONTRIBUTORS_TO_DISPLAY && (
                    <Container fontSize="Caption" color="black.600">
                      + {contributors.length - MAX_CONTRIBUTORS_TO_DISPLAY}
                    </Container>
                  )}
                </Flex>
              </Fragment>
            )}
          </Fragment>
        )}
      </Flex>
    );
  }
}

export default injectIntl(withUser(NewContributionFlowHeader));
