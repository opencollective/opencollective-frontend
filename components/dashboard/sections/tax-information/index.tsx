import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import { getI18nLink, I18nSupportLink } from '../../../I18nFormatters';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';

import { accountTaxInformationQuery } from './queries';
import { TaxInformationForm } from './TaxInformationForm';

const TaxInformationSettings = ({ account }) => {
  const completedTaxForm = account.usTaxForms.find(form => form.requestStatus === 'RECEIVED');
  if (!completedTaxForm) {
    return <TaxInformationForm account={account} />;
  } else {
    return (
      <div>
        <MessageBox type="info">
          <p>
            <FormattedMessage defaultMessage="Your tax information has been submitted successfully." />
          </p>
          <p>
            <FormattedMessage
              defaultMessage="We also sent you a copy of the signed document by email. If you experience any issues, <SupportLink>contact support</SupportLink>. Questions? See <DocsLink>help docs</DocsLink> about taxes."
              values={{
                SupportLink: I18nSupportLink,
                DocsLink: getI18nLink({
                  href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/tax-information',
                  openInNewTab: true,
                }),
              }}
            />
          </p>
        </MessageBox>
        <hr className="my-5" />
        <div className="flex gap-4">
          <Button variant="outline" disabled>
            <FormattedMessage defaultMessage="Current Tax info (PDF)" />
          </Button>
          <Button variant="outline" disabled>
            <FormattedMessage defaultMessage="Request to edit info" />
          </Button>
        </div>
      </div>
    );
  }
};

/**
 * A page for users to fill their info for W9/W8 tax forms.
 */
export const TaxInformationSettingsSection = ({ account }) => {
  const queryParams = { variables: { slug: account.slug }, context: API_V2_CONTEXT };
  const { data, error, loading } = useQuery(accountTaxInformationQuery, queryParams);
  return (
    <div>
      <h2 className="mb-4 text-3xl font-bold">
        <FormattedMessage defaultMessage="Tax Information" />
      </h2>

      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <TaxInformationSettings account={data.account} />
      )}
    </div>
  );
};
