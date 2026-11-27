import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ResendOTPCodeButton } from './signup/IndividualForm';
import { Button } from './ui/Button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/InputOTP';
import I18nFormatters from './I18nFormatters';

type SignupCodeVerificationProps = {
  email: string;
  loading?: boolean;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
};

/**
 * The code step shown in place by `SignInOrJoinFree` after the sign-up form: the visitor enters the
 * code sent by `/users/signup`.
 */
const SignupCodeVerification = ({ email, loading, onSubmit, onResend, onBack }: SignupCodeVerificationProps) => {
  const [otp, setOtp] = React.useState('');

  return (
    <form
      className="flex w-full flex-col items-center gap-6 text-center"
      data-cy="signup-code-form"
      onSubmit={event => {
        event.preventDefault();
        onSubmit(otp);
      }}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
          <FormattedMessage defaultMessage="Let's verify your email" id="signup.otp.title" />
        </h1>
        <p className="text-sm break-words text-slate-700 sm:text-base">
          <FormattedMessage
            defaultMessage="Enter the code sent to <strong>{email}</strong>."
            id="signup.individual.verifyOtp.description"
            values={{ email, ...I18nFormatters }}
          />
        </p>
      </div>
      <InputOTP
        maxLength={6}
        containerClassName="justify-center"
        value={otp}
        onChange={value => setOtp(value.toUpperCase())}
        onComplete={value => onSubmit(value.toUpperCase())}
        autoComplete="one-time-code"
        autoFocus
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <ResendOTPCodeButton type="button" variant="link" onClick={onResend} />
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button type="submit" disabled={otp.length < 6} loading={loading}>
          <FormattedMessage defaultMessage="Continue" id="actions.continue" />
        </Button>
        <Button type="button" variant="outline" disabled={loading} onClick={onBack}>
          <FormattedMessage defaultMessage="Go Back" id="GoBack" />
        </Button>
      </div>
    </form>
  );
};

export default SignupCodeVerification;
