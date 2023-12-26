import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Github } from '@styled-icons/fa-brands/Github';
import { Star } from '@styled-icons/fa-solid/Star';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import { P, Span } from '../Text';

const RepositoryEntry = ({ radio, value }) => {
  const { type } = value.owner;
  const repositoryTypeName = type === 'User' ? 'Personal Repo' : 'Organization Repo';

  return (
    <Fragment>
      <Container display="flex" justifyContent="space-between" alignItems="start">
        <Flex alignItems="center" flexGrow="1">
          <Span mr={4}>{radio}</Span>
          <Span mr={3} color="black.300">
            <Github size={40} />
          </Span>
          <Flex flexDirection="column" flex="1">
            <P fontWeight={500} fontSize="0.85rem">
              {value.full_name}
            </P>
            <Flex justifyContent="space-between" flexGrow="1">
              <P
                textTransform="uppercase"
                fontWeight={600}
                color="black.500"
                fontSize="0.65rem"
                mt={2}
                letterSpacing="0.4px"
              >
                {repositoryTypeName}
              </P>
              <Box display={['block', null, 'none']} ml={3} mr={1}>
                <Flex gap={4} color="black.600" mt={1} alignItems="center">
                  <P fontWeight={600} fontSize="0.75rem" lineHeight="0.85rem">
                    {value.stargazers_count}
                  </P>
                  <Star size={12} />
                </Flex>
              </Box>
            </Flex>
          </Flex>
        </Flex>
        <Box display={['none', null, 'block']}>
          <Flex gap={4} color="black.600" mt={1}>
            <P fontWeight={600} fontSize="0.75rem" lineHeight="0.85rem">
              {value.stargazers_count}
            </P>
            <Star size={12} />
          </Flex>
        </Box>
      </Container>
      {value.description && (
        <P color="black.700" fontSize="0.75rem" lineHeight="1.15rem" fontWeight="400" width={1} ml={4} mt={3} px={2}>
          {value.description}
        </P>
      )}
    </Fragment>
  );
};

RepositoryEntry.propTypes = {
  radio: PropTypes.object,
  value: PropTypes.shape({
    description: PropTypes.string,
    owner: PropTypes.object,
    stargazers_count: PropTypes.number, // eslint-disable-line camelcase
    full_name: PropTypes.string, // eslint-disable-line camelcase
    name: PropTypes.string,
  }),
  checked: PropTypes.bool,
};

export default RepositoryEntry;
