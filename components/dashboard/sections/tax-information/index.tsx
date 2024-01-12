import React from 'react';
import { useQuery } from '@apollo/client';
import { Overlay } from '@radix-ui/react-dialog';
import { FilePenLine, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import Avatar from '../../../Avatar';
import { getI18nLink, I18nSupportLink } from '../../../I18nFormatters';
import Image from '../../../Image';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';

import { accountTaxInformationQuery } from './queries';
import { TaxInformationForm } from './TaxInformationForm';

/**
 * UI for the pending state of the tax form submission, with a button to fill the form.
 */
const PendingTaxFormView = ({ account }) => {
  const intl = useIntl();
  const [isFormDirty, setIsFormDirty] = React.useState(false);
  const [hasTaxInformationForm, setHasTaxInformationForm] = React.useState(false);
  const requestService = account.usTaxForms[0]?.service;

  const onOpen = () => {
    setIsFormDirty(false);
    setHasTaxInformationForm(true);
  };

  const onClose = () => {
    if (!isFormDirty) {
      setHasTaxInformationForm(false);
    } else {
      const confirmMsg = intl.formatMessage({
        defaultMessage: 'You have unsaved changes. Are you sure you want to close this?',
      });
      if (confirm(confirmMsg)) {
        setHasTaxInformationForm(false);
      }
    }
  };

  return (
    <div>
      <MessageBox type="warning" withIcon>
        <strong>
          <FormattedMessage defaultMessage="We need your tax information before we can pay you." />
        </strong>
        <p>
          <FormattedMessage
            defaultMessage="If you experience any issues, please contact <SupportLink>our support</SupportLink>. Questions? See <HelpDocsLink>help docs</HelpDocsLink> about taxes."
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
          <FormattedMessage defaultMessage="You will receive an email with a link to fill out a form." />
        </p>
      ) : (
        <Button size="lg" onClick={onOpen}>
          <FilePenLine className="mr-1" size={16} />
          <FormattedMessage defaultMessage="Fill Tax Information" />
        </Button>
      )}
      <Dialog onOpenChange={isOpen => (isOpen ? onOpen() : onClose())} open={hasTaxInformationForm}>
        <Overlay className="fixed inset-0 z-[3000] max-h-screen min-h-full overflow-y-auto bg-white px-0 py-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out data-[state=open]:zoom-in">
          <div className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-md">
            <div className="text-sm">
              <h2 className="text-xl font-bold">
                <FormattedMessage defaultMessage="Update Tax Information" />
              </h2>
              <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                <FormattedMessage
                  defaultMessage="for {account}"
                  values={{
                    account: (
                      <LinkCollective openInNewTab collective={account} className="flex items-center gap-1">
                        <Avatar collective={account} size={18} />
                        {account.legalName || account.name}
                      </LinkCollective>
                    ),
                  }}
                />
              </div>
            </div>
            <Button variant="secondary" className="text-base" onClick={onClose}>
              <FormattedMessage id="Close" defaultMessage="Close" />
              <X className="ml-2" size={16} />
            </Button>
          </div>
          <div className="px-6 py-8 md:px-10">
            <TaxInformationForm account={account} setFormDirty={setIsFormDirty} />
          </div>
        </Overlay>
      </Dialog>
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
        <Link href={`/contact?topic=${encodeURIComponent('Update tax information')}`}>
          <Button variant="outline">
            <FormattedMessage defaultMessage="Request to edit info" />
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
  const queryParams = { variables: { slug: account.slug }, context: API_V2_CONTEXT };
  const { data, error, loading } = useQuery(accountTaxInformationQuery, queryParams);
  const taxForms = data?.account?.usTaxForms || [];
  return (
    <div>
      <h2 className="mb-8 text-3xl font-bold">
        <FormattedMessage defaultMessage="Tax Information" />
      </h2>

      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !taxForms.length ? (
        <div className="flex items-center justify-between gap-5 text-xl">
          <Image src="/static/images/illustrations/plant.png" alt="" width={164} height={164} />
          <FormattedMessage defaultMessage="You currently do not need to fill out any tax related information. Should this become necessary, you will be alerted and guided through the process." />
        </div>
      ) : taxForms.find(form => form.status === 'RECEIVED') ? (
        <TaxFormSuccessView />
      ) : (
        <PendingTaxFormView account={data.account} />
      )}
    </div>
  );
};
