import type { OrganizationSignupMutation } from '@/lib/graphql/types/v2/graphql';

export enum SignupSteps {
  EMAIL_INPUT = 'EMAIL_INPUT',
  VERIFY_OTP = 'VERIFY_OTP',
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
  CREATE_ORG = 'CREATE_ORG',
  INVITE_ADMINS = 'INVITE_ADMINS',
}

export type SignupStepProps = {
  step: SignupSteps;
  nextStep: (step?: SignupSteps, completeAction?: () => void, query?: Record<string, string | string[]>) => void;
  setCreatedOrganization?: (organizationData: OrganizationSignupMutation['createOrganization']) => void;
  createdOrganization?: OrganizationSignupMutation['createOrganization'];
};
