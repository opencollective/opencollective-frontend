import React, { useState } from 'react';
import PropTypes from 'prop-types';

import AboutOurFees from '../components/ocf-host-application/AboutOurFees';
import ApplicationForm from '../components/ocf-host-application/ApplicationForm';
import TermsOfFiscalSponsorship from '../components/ocf-host-application/TermsOfFiscalSponsorship';
import YourInitiativeIsNearlyThere from '../components/ocf-host-application/YourInitiativeIsNearlyThere';
import Page from '../components/Page';

const OCFHostApplication = ({ step }) => {
  const [checkedTermsOfFiscalSponsorship, setCheckedTermsOfFiscalSponsorship] = useState(false);

  return (
    <Page title="Open collective foundation application">
      {step === 'intro' && (
        <TermsOfFiscalSponsorship
          checked={checkedTermsOfFiscalSponsorship}
          onChecked={setCheckedTermsOfFiscalSponsorship}
        />
      )}
      {step === 'fees' && <AboutOurFees />}
      {step === 'form' && <ApplicationForm />}
      {step === 'success' && <YourInitiativeIsNearlyThere />}
    </Page>
  );
};

OCFHostApplication.propTypes = {
  step: PropTypes.string,
};

export async function getServerSideProps({ query }) {
  return { props: { step: query.step || 'intro' } };
}

export default OCFHostApplication;
