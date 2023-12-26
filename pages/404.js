import React from 'react';

import Container from '../components/Container';
import NotFound from '../components/NotFound';
import Page from '../components/Page';

export default function Custom404() {
  return (
    <Page data-cy="error-page">
      <Container py={[5, 6]}>
        <NotFound />
      </Container>
    </Page>
  );
}
