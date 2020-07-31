import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import Avatar, { ContributorAvatar } from '../../components/Avatar';
import Container from '../../components/Container';
import FormattedMoneyAmount from '../../components/FormattedMoneyAmount';
import { Box, Flex } from '../../components/Grid';
import { H3, P } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

class NewContributionFlowHeader extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      currency: PropTypes.string,
      name: PropTypes.string,
      contributors: PropTypes.shape({
        totalCount: PropTypes.number,
        nodes: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
          }),
        ),
      }),
    }).isRequired,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
  };

  render() {
    const { collective } = this.props;
    const contributors = collective.contributors?.nodes;
    const loggedInUserIsContributor = false; // TODO
    const loggedInUserTotalDonations = 0; // TODO

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
            {contributors?.length > 0 && (
              <Fragment>
                <P fontSize="LeadParagraph" lineHeight="24px" fontWeight={400} color="black.500" py={2}>
                  <FormattedMessage
                    id="NewContributionFlow.Join"
                    defaultMessage="Join {numberOfContributors} other fellow contributors"
                    values={{ numberOfContributors: collective.contributors.totalCount }}
                  />
                </P>
                <Flex py={2} alignItems="center">
                  {contributors.map(contributor => (
                    <Box key={contributor.id} mx={1}>
                      <ContributorAvatar contributor={contributor} radius={24} />
                    </Box>
                  ))}
                  {collective.contributors.totalCount > contributors.length && (
                    <Container fontSize="Caption" color="black.600">
                      + {collective.contributors.totalCount - contributors.length}
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
