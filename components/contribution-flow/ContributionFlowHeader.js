import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import FormattedMoneyAmount from '../../components/FormattedMoneyAmount';

import Avatar, { ContributorAvatar } from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { H1, P } from '../Text';
import { withUser } from '../UserProvider';

import CollectiveTitleContainer from './CollectiveTitleContainer';

class NewContributionFlowHeader extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      slug: PropTypes.string,
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
    loggedInAccount: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    isEmbed: PropTypes.bool,
  };

  render() {
    const { collective, isEmbed, loggedInAccount } = this.props;
    const contributors = collective.contributors?.nodes;
    let loggedInUserTotalDonations = 0;

    if (loggedInAccount?.memberOf?.nodes?.length > 0) {
      loggedInUserTotalDonations = loggedInAccount.memberOf.nodes[0].totalDonations.value * 100;
    }

    return (
      <Flex flexDirection={['column', null, 'row']} alignItems="center" maxWidth={500}>
        <Box mx={3}>
          <Avatar collective={collective} radius={[65, null, 96]} />
        </Box>
        <Flex flexDirection="column" alignItems="center">
          <CollectiveTitleContainer useLink={!isEmbed} collective={collective} linkColor="#333">
            <H1
              textAlign="center"
              fontSize={['28px', null, '32px']}
              lineHeight="40px"
              fontWeight={500}
              title={collective.name}
            >
              <FormattedMessage
                id="CreateOrder.Title"
                defaultMessage="Contribute to {collective}"
                values={{ collective: truncate(collective.name, { length: 60 }) }}
              />
            </H1>
          </CollectiveTitleContainer>
          {loggedInUserTotalDonations > 0 ? (
            <P py={2}>
              <FormattedMessage
                defaultMessage="You have contributed {amount} to {collective} so far. Keep it going!"
                values={{
                  collective: collective.name,
                  amount: (
                    <FormattedMoneyAmount
                      precision={2}
                      amount={loggedInUserTotalDonations}
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
                  <P fontSize="16px" lineHeight="24px" fontWeight={400} color="black.500" py={2}>
                    <FormattedMessage
                      id="NewContributionFlow.Join"
                      defaultMessage="Join {numberOfContributors} other fellow contributors"
                      values={{ numberOfContributors: collective.contributors.totalCount }}
                    />
                  </P>
                  <Flex alignItems="center">
                    {contributors.map(contributor => (
                      <Box key={contributor.id} mx={1}>
                        <ContributorAvatar contributor={contributor} radius={24} />
                      </Box>
                    ))}
                    {collective.contributors.totalCount > contributors.length && (
                      <Container fontSize="12px" color="black.600">
                        + {collective.contributors.totalCount - contributors.length}
                      </Container>
                    )}
                  </Flex>
                </Fragment>
              )}
            </Fragment>
          )}
        </Flex>
      </Flex>
    );
  }
}

export default injectIntl(withUser(NewContributionFlowHeader));
