import React from 'react';

import AuthenticatedPage from '../components/AuthenticatedPage';
import { Flex } from '../components/Grid';
import StyledCard from '../components/StyledCard';
import StyledHr from '../components/StyledHr';
import ClearCacheForAccountForm from '../components/superpowers/ClearCacheForAccountForm';
import { H1, H2 } from '../components/Text';

const SuperPowersPage = () => {
  return (
    <AuthenticatedPage disableSignup rootOnly>
      <Flex flexDirection="column" maxWidth="550px" alignItems="center" mx="auto" px={2} py={5}>
        <H1 mb={5}>Root actions</H1>
        <StyledCard p={4} width="100%">
          <H2 lineHeight="30px" fontSize="20px">
            Clear cache for account
          </H2>
          <StyledHr borderColor="#DCDEE0" mb={3} mt={2} />
          <ClearCacheForAccountForm />
        </StyledCard>
      </Flex>
    </AuthenticatedPage>
  );
};

SuperPowersPage.propTypes = {};

export default SuperPowersPage;
