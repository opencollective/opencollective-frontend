import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { Github } from '@styled-icons/fa-brands/Github';
import { Star } from '@styled-icons/fa-solid/Star';

import Container from '../../Container';
import { P, Span } from '../../Text';
import StyledRadioList from '../../StyledRadioList';

const RepositoryEntry = ({ radio, value, checked, changeRepoInfo }) => {
  const { type, login } = value.owner;
  const repositoryTypeName = type === 'User' ? 'Personal Repo' : 'Organization Repo';

  return (
    <Fragment>
      <Container
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexDirection={['column', 'row']}
      >
        <Flex>
          <Span mr={3}>{radio}</Span>
          <Span mr={3} color="black.300">
            <Github size={[40]} />
          </Span>
          <Flex flexDirection="column">
            <P fontWeight={500} fontSize="1.4rem">
              {value.full_name}
            </P>
            <Flex>
              <P textTransform="uppercase" color="black.400" fontSize="1rem">
                {repositoryTypeName}
              </P>
              <Box display={['block', null, 'none']} ml={3}>
                <P fontWeight={300} fontSize="1.2rem">
                  {value.stargazers_count} <Star size={12} />
                </P>
              </Box>
            </Flex>
          </Flex>
        </Flex>
        <Box display={['none', null, 'block']}>
          <P fontWeight={300} fontSize="1.2rem">
            {value.stargazers_count} <Star size={12} />
          </P>
        </Box>
      </Container>
      <Container width={1} mx={3} my={2} px={2}>
        {value.description && (
          <P color="black.600" fontSize="1.2rem" fontWeight="400">
            {value.description}
          </P>
        )}
        {checked && (
          <Container my={3}>
            {type === 'Organization' && (
              <StyledRadioList
                id="useType"
                name="useType"
                options={['repository', 'organization']}
                onChange={({ key }) => {
                  changeRepoInfo(key, value);
                }}
              >
                {props => {
                  return (
                    <Container cursor="pointer">
                      {props.value === 'repository' && (
                        <Container fontWeight="400" fontSize="1.2rem" mb={2}>
                          <Span mr={3}>{props.radio}</Span>
                          Create a collective for the repository ({value.name})
                        </Container>
                      )}
                      {props.value === 'organization' && (
                        <Container fontWeight="400" fontSize="1.2rem" mb={4}>
                          <Span mr={3}>{props.radio}</Span>
                          Create a collective for the organization ({login})
                        </Container>
                      )}
                    </Container>
                  );
                }}
              </StyledRadioList>
            )}
          </Container>
        )}
      </Container>
    </Fragment>
  );
};

RepositoryEntry.propTypes = {
  radio: PropTypes.object,
  value: PropTypes.shape({
    description: PropTypes.string,
    owner: PropTypes.object,
    stargazers_count: PropTypes.number,
    full_name: PropTypes.string,
    name: PropTypes.string,
  }),
  checked: PropTypes.bool,
  changeRepoInfo: PropTypes.func,
};

export default RepositoryEntry;
