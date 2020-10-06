import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import Avatar, { ContributorAvatar } from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { H1, P } from '../Text';
import { withUser } from '../UserProvider';

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

    return (
      <Flex flexDirection={['column', null, 'row']} alignItems="center" maxWidth={500}>
        <Box mx={3}>
          <Avatar collective={collective} radius={[65, null, 96]} />
        </Box>
        <div>
          <H1 textAlign="center" fontSize={['28px', null, '32px']} lineHeight="40px" fontWeight={500}>
            <FormattedMessage
              id="CreateOrder.Title"
              defaultMessage="Contribute to {collective}"
              values={{ collective: collective.name }}
            />
          </H1>
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
        </div>
      </Flex>
    );
  }
}

export default injectIntl(withUser(NewContributionFlowHeader));
