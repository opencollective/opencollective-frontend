import React from 'react';
import PropTypes from 'prop-types';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { require2FAForAdmins } from '../../lib/policies';

import Container from '../Container';
import { TwoFactorAuthRequiredMessage } from '../TwoFactorAuthRequiredMessage';

import PaymentMethodList from './PaymentMethodList';

const StepPayment = ({
  stepDetails,
  stepProfile,
  stepPayment,
  stepSummary,
  collective,
  onChange,
  isSubmitting,
  isEmbed,
  hideCreditCardPostalCode,
  onNewCardFormReady,
  disabledPaymentMethodTypes,
}) => {
  const { LoggedInUser } = useLoggedInUser();

  React.useEffect(() => {
    track(AnalyticsEvent.CONTRIBUTION_PAYMENT_STEP);
  }, []);

  if (require2FAForAdmins(stepProfile) && !LoggedInUser?.hasTwoFactorAuth) {
    return <TwoFactorAuthRequiredMessage borderWidth={0} noTitle />;
  }

  return (
    <Container width={1} border={['1px solid #DCDEE0', 'none']} borderRadius={15}>
      <PaymentMethodList
        host={collective.host}
        toAccount={collective}
        disabledPaymentMethodTypes={disabledPaymentMethodTypes}
        stepSummary={stepSummary}
        stepDetails={stepDetails}
        stepPayment={stepPayment}
        stepProfile={stepProfile}
        isEmbed={isEmbed}
        isSubmitting={isSubmitting}
        hideCreditCardPostalCode={hideCreditCardPostalCode}
        onNewCardFormReady={onNewCardFormReady}
        onChange={onChange}
      />
    </Container>
  );
};

StepPayment.propTypes = {
  collective: PropTypes.object,
  stepDetails: PropTypes.object,
  stepPayment: PropTypes.object,
  stepProfile: PropTypes.object,
  stepSummary: PropTypes.object,
  onChange: PropTypes.func,
  onNewCardFormReady: PropTypes.func,
  hideCreditCardPostalCode: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  isEmbed: PropTypes.bool,
  disabledPaymentMethodTypes: PropTypes.arrayOf(PropTypes.string),
};

StepPayment.defaultProps = {
  hideCreditCardPostalCode: false,
};

export default StepPayment;
