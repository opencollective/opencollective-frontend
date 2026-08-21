import React from 'react';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { AnalyticsProperty } from '../../lib/analytics/properties';
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
  hideCreditCardPostalCode = false,
  onNewCardFormReady,
  disabledPaymentMethodTypes,
  showPlatformTip,
  isOscTipExperiment,
}) => {
  const { LoggedInUser } = useLoggedInUser();

  React.useEffect(() => {
    track(AnalyticsEvent.CONTRIBUTION_PAYMENT_STEP, {
      props: {
        [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_VARIANT]: stepDetails?.isNewPlatformTip ? 'new' : 'old',
        [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_ENABLED]: Boolean(showPlatformTip),
        [AnalyticsProperty.CONTRIBUTION_IS_OSC_TIP_EXPERIMENT]: Boolean(isOscTipExperiment),
        [AnalyticsProperty.CONTRIBUTION_HOST_SLUG]: collective?.host?.slug,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default StepPayment;
