import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import AboutOurFees from '../components/ocf-host-application/AboutOurFees';
import ApplicationForm from '../components/ocf-host-application/ApplicationForm';
import TermsOfFiscalSponsorship from '../components/ocf-host-application/TermsOfFiscalSponsorship';
import YourInitiativeIsNearlyThere from '../components/ocf-host-application/YourInitiativeIsNearlyThere';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

const OCFHostApplication = ({ loadingLoggedInUser, LoggedInUser }) => {
  const [checkedTermsOfFiscalSponsorship, setCheckedTermsOfFiscalSponsorship] = useState(false);
  const router = useRouter();
  const step = router.query.step || 'intro';

  return (
    <Page title="Open collective foundation application">
      {step === 'intro' && (
        <TermsOfFiscalSponsorship
          checked={checkedTermsOfFiscalSponsorship}
          onChecked={setCheckedTermsOfFiscalSponsorship}
        />
      )}
      {step === 'fees' && <AboutOurFees />}
      {step === 'form' && <ApplicationForm loadingLoggedInUser={loadingLoggedInUser} LoggedInUser={LoggedInUser} />}
      {step === 'success' && <YourInitiativeIsNearlyThere />}
    </Page>
  );
};

OCFHostApplication.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
};

export default withUser(OCFHostApplication);
