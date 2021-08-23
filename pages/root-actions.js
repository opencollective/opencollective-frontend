import React from 'react';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';
import { useRouter } from 'next/router';
import styled, { css } from 'styled-components';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import { Box, Grid } from '../components/Grid';
import ClearCacheForAccountForm from '../components/root-actions/ClearCacheForAccountForm';
import MergeAccountsForm from '../components/root-actions/MergeAccountsForm';
import StyledCard from '../components/StyledCard';
import StyledHr from '../components/StyledHr';
import { H1, H2, H3, P, Span } from '../components/Text';

const GRID_TEMPLATE_COLUMNS = ['minmax(220px, 1fr) 6fr'];

const MENU = [
  { id: 'Clear cache', title: 'Clear cache for account', Component: ClearCacheForAccountForm },
  { id: 'Merge accounts', isDangerous: true, Component: MergeAccountsForm, isHidden: true },
];

const MenuEntry = styled.button`
  background: white;
  padding: 16px;
  cursor: pointer;
  background: none;
  color: inherit;
  border: none;
  font: inherit;
  outline: inherit;
  width: 100%;
  text-align: left;

  ${props =>
    props.isActive &&
    css`
      font-weight: 800;
      background: #f3f3f3;
    `}

  &: hover {
    background: #f9f9f9;
  }
`;

const SuperPowersPage = () => {
  const [selectedMenuEntry, setSelectedMenuEntry] = React.useState(MENU[0]);
  const router = useRouter();
  const showHiddenActions = Boolean(router.query.showHiddenActions);
  return (
    <AuthenticatedPage disableSignup rootOnly>
      <Container maxWidth="1000px" m="0 auto" mt={4} borderBottom="1px solid #e5e5e5">
        <H1 textAlign="left" fontSize="32px" py={2}>
          Root actions
        </H1>
      </Container>
      <Grid gridGap={64} gridTemplateColumns={GRID_TEMPLATE_COLUMNS} maxWidth="1000px" m="0 auto" mb={5}>
        <Container minHeight="600px" borderRight="1px solid #e5e5e5">
          {MENU.filter(e => showHiddenActions || !e.isHidden).map(menuEntry => (
            <MenuEntry
              key={menuEntry.id}
              title={menuEntry.title || menuEntry.id}
              isActive={selectedMenuEntry.id === menuEntry.id}
              onClick={() => setSelectedMenuEntry(menuEntry)}
            >
              {menuEntry.id}
            </MenuEntry>
          ))}
        </Container>
        <Box py={4}>
          {selectedMenuEntry.isDangerous && (
            <Container textAlign="center" mb={4}>
              <H2 fontSize="30px" css={{ textShadow: '0px 2px 2px red' }}>
                <ExclamationTriangle color="red" size={30} />
                <Span ml={3} css={{ verticalAlign: 'middle' }}>
                  DANGEROUS ACTION
                </Span>
              </H2>
              <P mt={2}>Please be super careful with the action below, and double check everything you do.</P>
              <StyledHr width="100%" mt={4} />
            </Container>
          )}
          <StyledCard p={4} width="100%">
            <H3 lineHeight="30px" fontSize="20px">
              {selectedMenuEntry.title || selectedMenuEntry.id}
            </H3>
            <StyledHr borderColor="#DCDEE0" mb={3} mt={2} />
            <selectedMenuEntry.Component />
          </StyledCard>
        </Box>
      </Grid>
    </AuthenticatedPage>
  );
};

SuperPowersPage.propTypes = {};

export default SuperPowersPage;
