import React from 'react';
import { gql, useMutation } from '@apollo/client';

import { LOCAL_STORAGE_KEYS, setLocalStorage } from '../local-storage';

const generateGoCardlessLinkMutation = gql`
  mutation GenerateGoCardlessLink($input: GoCardlessLinkInput!, $host: AccountReferenceInput!) {
    generateGoCardlessLink(input: $input, host: $host) {
      id
      institutionId
      link
      redirect
    }
  }
`;

export const useRedirectToGoCardlessConnect = () => {
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [generateGoCardlessLink] = useMutation(generateGoCardlessLinkMutation);

  const redirectToGoCardlessConnect = async (
    hostId: string,
    institutionId: string,
    { locale = 'en', transactionImportId }: { locale?: string; transactionImportId?: string },
  ) => {
    setIsRedirecting(true);

    try {
      const result = await generateGoCardlessLink({
        variables: {
          host: {
            id: hostId,
          },
          input: {
            institutionId: institutionId,
            userLanguage: locale ?? 'en',
            accountSelection: true,
          },
        },
      });

      const link = result.data?.generateGoCardlessLink?.link;
      if (link) {
        // Redirect to the GoCardless authorization page
        setLocalStorage(
          LOCAL_STORAGE_KEYS.GOCARDLESS_DATA,
          JSON.stringify({
            date: new Date().toISOString(),
            hostId,
            requisitionId: result.data?.generateGoCardlessLink?.id,
            transactionImportId,
          }),
        );
        window.location.href = link;
      } else {
        throw new Error('No link received from GoCardless');
      }
    } catch (e) {
      // Only set isRedirecting to false if there is an error ; otherwise the loading spinner
      // should say until we've moved to the external page
      setIsRedirecting(false);
      throw e;
    }
  };

  return { redirectToGoCardlessConnect, isRedirecting };
};
