import React from 'react';
import { useQuery } from '@apollo/client';
import { FilePenLine } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import { getI18nLink, I18nSupportLink } from '../../../I18nFormatters';
import Image from '../../../Image';
import Link from '../../../Link';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';

import { accountTaxInformationQuery } from './queries';
import { TaxInformationFormDialog } from './TaxInformationFormDialog';

/**
 * UI for the pending state of the tax form submission, with a button to fill the form.
 */
const PendingTaxFormView = ({ account }) => {
  const [hasTaxInformationForm, setHasTaxInformationForm] = React.useState(false);
  const requestService = account.usTaxForms[0]?.service;

  return (
    <div>
      <MessageBox type="warning" withIcon>
        <strong>
          <FormattedMessage defaultMessage="We need your tax information before we can pay you." id="a6tGTW" />
        </strong>
        <p className="my-2">
          <FormattedMessage
            defaultMessage="United States regulations require US entities to collect certain information from payees for tax reporting purposes, even if the payee is outside the US."
            id="H/ROIG"
          />
        </p>
        <p>
          <FormattedMessage
            defaultMessage="If you experience any issues, please contact <SupportLink>our support</SupportLink>. Questions? See <HelpDocsLink>help docs</HelpDocsLink> about taxes."
            id="A5CKz8"
            values={{
              SupportLink: I18nSupportLink,
              HelpDocsLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/tax-information',
                openInNewTab: true,
              }),
            }}
          />
        </p>
      </MessageBox>
      <hr className="my-8" />
      {requestService === 'DROPBOX_FORMS' ? (
        <p>
          <FormattedMessage defaultMessage="You will receive an email with a link to fill out a form." id="V2vf/v" />
        </p>
      ) : (
        <Button size="lg" onClick={() => setHasTaxInformationForm(true)}>
          <FilePenLine className="mr-1" size={16} />
          <FormattedMessage defaultMessage="Fill Tax Information" id="TxJpk1" />
        </Button>
      )}
      <TaxInformationFormDialog
        account={account}
        open={hasTaxInformationForm}
        onOpenChange={setHasTaxInformationForm}
      />
    </div>
  );
};

/**
 * UI for the success state of the tax form submission, with buttons to download the PDF and request to edit the info.
 */
const TaxFormSuccessView = () => {
  return (
    <div>
      <MessageBox type="info">
        <p className="mb-2 font-bold">
          <FormattedMessage defaultMessage="Your tax information has been submitted successfully." id="By+kN6" />
        </p>
        <p>
          <FormattedMessage
            defaultMessage="We also sent you a copy of the signed document by email. If you experience any issues, <SupportLink>contact support</SupportLink>. Questions? See <DocsLink>help docs</DocsLink> about taxes."
            id="MR3j9g"
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
        <Link href={`/contact?topic=${encodeURIComponent('Update tax information')}`}>
          <Button variant="outline">
            <FormattedMessage defaultMessage="Request to edit info" id="sTxTcl" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

/**
 * A page for users to fill their info for W9/W8 tax forms.
 */
export const TaxInformationSettingsSection = ({ account }) => {
  const queryParams = { variables: { id: account.id }, context: API_V2_CONTEXT };
  const { data, error, loading } = useQuery(accountTaxInformationQuery, queryParams);
  const taxForms = data?.account?.usTaxForms || [];
  return (
    <div>
      <h2 className="mb-8 text-3xl font-bold">
        <FormattedMessage defaultMessage="Tax Information" id="r/dTTe" />
      </h2>

      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !taxForms.length ? (
        <div className="flex items-center justify-between gap-5 text-xl">
          <Image src="/static/images/illustrations/plant.png" alt="" width={164} height={164} />
          <FormattedMessage
            defaultMessage="You currently do not need to fill out any tax related information. Should this become necessary, you will be alerted and guided through the process."
            id="Mdn+cL"
          />
        </div>
      ) : taxForms.find(form => form.status === 'RECEIVED') ? (
        <TaxFormSuccessView />
      ) : (
        <PendingTaxFormView account={data.account} />
      )}
    </div>
  );
};
