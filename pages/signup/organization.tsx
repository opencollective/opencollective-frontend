import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

import { confettiFireworks } from '@/lib/confettis';
import type { Collective } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import Image from '@/components/Image';
import Link from '@/components/Link';
import Page from '@/components/Page';
import OrganizationForm, { type OrganizationFormProps } from '@/components/signup/OrganizationForm';

// ts-unused-exports:disable-next-line
export default function SignupOrganizationPage() {
  const router = useRouter();
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [createdOrganization, setCreatedOrganization] = useState<Pick<Collective, 'slug' | 'name'>>(null);

  const handleSuccess: OrganizationFormProps['onSuccess'] = async organization => {
    setCreatedOrganization(organization);
    confettiFireworks();
    // Reload membership data to ensure user can access the dashboard for the newly created organization
    await refetchLoggedInUser();
    if (LoggedInUser) {
      setTimeout(() => {
        router.push(`/dashboard/${organization.slug}`);
      }, 5000);
    }
  };

  return (
    <Page title="Create Organization" showFooter={!createdOrganization}>
      <div className="mx-auto my-6 mb-16 max-w-2xl px-2 md:my-32 md:px-3 lg:px-4">
        {createdOrganization ? (
          <React.Fragment>
            <div className="mb-8 flex justify-center">
              <Image
                src="/static/images/become-a-host/ABetterExperience-icon.png"
                alt="A Better Experience Icon"
                width={208}
                height={208}
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-8 text-center">
              <h1 className="text-3xl font-semibold">
                <FormattedMessage
                  id="Welcome"
                  defaultMessage="Welcome, {orgName}!"
                  values={{ orgName: createdOrganization.name }}
                />
              </h1>
              {LoggedInUser ? (
                <div>
                  <FormattedMessage
                    id="signup.orgCreated.description"
                    defaultMessage="Your organization has been successfully created."
                  />
                  <p className="mt-2 text-xs">
                    <FormattedMessage
                      id="signup.orgCreated.redirecting"
                      defaultMessage="We're redirecting you to your <link>organization's dashboard</link>..."
                      values={{
                        link: (chunks: React.ReactNode) => (
                          <Link href={`/dashboard/${createdOrganization.slug}`} className="underline">
                            {chunks}
                          </Link>
                        ),
                      }}
                    />
                  </p>
                </div>
              ) : (
                <div>
                  <FormattedMessage
                    id="signup.orgCreated.descriptionNoUser"
                    defaultMessage="Your organization has been successfully created. We've sent you a confirmation email, please proceed from there!"
                  />
                  <p className="mt-2 text-xs">
                    <FormattedMessage
                      id="SignIn.SuccessDetails"
                      defaultMessage="You’ll be redirected from the link in the email, you can safely close this tab."
                    />
                  </p>
                </div>
              )}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h1 className="mb-4 text-2xl font-semibold md:mb-8">
              <FormattedMessage id="organization.create" defaultMessage="Create Organization" />
            </h1>
            <OrganizationForm onSuccess={handleSuccess} />
          </React.Fragment>
        )}
      </div>
    </Page>
  );
}
