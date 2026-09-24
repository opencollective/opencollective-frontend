import React from 'react';
import { useRouter } from 'next/router';

import Container from '../components/Container';
import NotFound from '../components/NotFound';
import Page from '../components/Page';

// next.js export
// ts-unused-exports:disable-next-line
export default function Custom404() {
  const router = useRouter();

  return (
    <Page data-cy="error-page">
      <Container py={[5, 6]}>
        <NotFound searchTerm={router.query?.slug} />
      </Container>
    </Page>
  );
}
