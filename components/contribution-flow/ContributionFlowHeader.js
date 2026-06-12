import React, { Fragment } from 'react';
import { truncate } from 'lodash-es';
import { FormattedMessage } from 'react-intl';

import Avatar, { ContributorAvatar } from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { H1, P } from '../Text';

import CollectiveTitleContainer from './CollectiveTitleContainer';

const ContributionFlowHeader = ({ collective, isEmbed }) => {
  const contributors = collective.contributors?.nodes;

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
        {contributors?.length > 0 && (
          <Fragment>
            <P fontSize="16px" lineHeight="24px" fontWeight={400} color="black.500" py={2}>
              <FormattedMessage
                id="NewContributionFlow.Join"
                defaultMessage="Join {numberOfContributors} other fellow contributors"
                values={{ numberOfContributors: collective.contributors?.totalCount ?? 0 }}
              />
            </P>
            <Flex alignItems="center">
              {contributors.map(contributor => (
                <Box key={contributor.id} mx={1}>
                  <ContributorAvatar contributor={contributor} radius={24} />
                </Box>
              ))}
              {(collective.contributors?.totalCount ?? 0) > contributors.length && (
                <Container fontSize="12px" color="black.600">
                  + {(collective.contributors?.totalCount ?? 0) - contributors.length}
                </Container>
              )}
            </Flex>
          </Fragment>
        )}
      </Flex>
    </Flex>
  );
};

export default ContributionFlowHeader;
