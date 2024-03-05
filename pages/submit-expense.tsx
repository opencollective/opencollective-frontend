import React from 'react';
import { useRouter } from 'next/router';

import Page from '../components/Page';
import { SubmitExpenseFlow } from '../components/submit-expense/SubmitExpenseFlow';

// ignore unused exports default
// next.js export
export default function SubmitExpensePage() {
  const router = useRouter();
  return (
    <Page noRobots title={'oc'} showFooter={false} withTopBar={false}>
      <SubmitExpenseFlow slug={router.query.slug as string} />
    </Page>
  );
}
