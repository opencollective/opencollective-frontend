import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import Image from 'next/image';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { hasAccountHosting, hasAccountMoneyManagement } from '@/lib/collective';
import { API_V2_CONTEXT, gql } from '@/lib/graphql/helpers';
import { editCollectivePageQuery } from '@/lib/graphql/v1/queries';

import { useModal } from '../../ModalContext';

import SettingsSectionTitle from './SettingsSectionTitle';

const editMoneyManagementAndHostingMutation = gql`
  mutation EditMoneyManagementAndHosting(
    $organization: AccountReferenceInput!
    $hasMoneyManagement: Boolean
    $hasHosting: Boolean
  ) {
    editOrganizationMoneyManagementAndHosting(
      organization: $organization
      hasMoneyManagement: $hasMoneyManagement
      hasHosting: $hasHosting
    ) {
      id
      isHost
      hasMoneyManagement
      hasHosting
      settings
    }
  }
`;

const fiscalHostingQuery = gql`
  query FiscalHosting($id: String!) {
    host(id: $id) {
      id
      totalHostedAccounts
    }
  }
`;

const messages = defineMessages({
  modalTitleHosting: { id: 'FiscalHosting.modal.title.hosting', defaultMessage: 'Change to Fiscal Hosting' },
  modalTitleMoney: { id: 'FiscalHosting.modal.title.money', defaultMessage: 'Change to Money Management' },
  modalTitleSimple: { id: 'FiscalHosting.modal.title.simple', defaultMessage: 'Change to Simple Organization' },
  modalDescription: {
    id: 'FiscalHosting.modal.description',
    defaultMessage: "Review the changes to your organization's capabilities.",
  },
  featuresGain: { id: 'FiscalHosting.modal.featuresGain', defaultMessage: "Features you'll gain" },
  featuresLose: { id: 'FiscalHosting.modal.featuresLose', defaultMessage: "Features you'll lose" },
  cardSimpleTitle: { id: 'FiscalHosting.SimpleOrganization.title', defaultMessage: 'Simple Organization' },
  cardSimpleDescription: {
    id: 'FiscalHosting.SimpleOrganization.description',
    defaultMessage: 'Manage your organization profile, make financial contributions, and submit expenses to others.',
  },
  cardMoneyTitle: { id: 'Welcome.Organization.MoneyManagement', defaultMessage: 'Money Management' },
  cardMoneyDescription: {
    id: 'FiscalHosting.moneyManagement.description',
    defaultMessage: 'Receive contributions, hold a balance, and pay expenses. Includes projects and events.',
  },
  cardHostingTitle: { id: 'editCollective.fiscalHosting', defaultMessage: 'Fiscal Hosting' },
  cardHostingDescription: {
    id: 'FiscalHosting.fiscalHost.description',
    defaultMessage:
      'Host collectives, hold their balances, and manage their contributions and expenses. Includes funds and grants.',
  },
});

const featureMessages = defineMessages({
  balance: { id: 'FiscalHosting.features.balance', defaultMessage: 'Hold a balance' },
  contributions: { id: 'FiscalHosting.features.contributions', defaultMessage: 'Receive financial contributions' },
  expenses: { id: 'FiscalHosting.features.expenses', defaultMessage: 'Manage and pay expenses' },
  projectsEvents: { id: 'FiscalHosting.features.projectsEvents', defaultMessage: 'Manage projects and events' },
  hostCollectives: { id: 'FiscalHosting.features.hostCollectives', defaultMessage: 'Host collectives' },
  hostBalance: { id: 'FiscalHosting.features.hostBalance', defaultMessage: 'Hold collective balances' },
  hostContributions: {
    id: 'FiscalHosting.features.hostContributions',
    defaultMessage: 'Receive collective contributions',
  },
  hostExpenses: { id: 'FiscalHosting.features.hostExpenses', defaultMessage: 'Manage and pay collective expenses' },
  funds: { id: 'FiscalHosting.features.funds', defaultMessage: 'Funds & Grants management' },
});

type CapabilityId = 'simple-organization' | 'money-management' | 'fiscal-hosting';

const capabilityRank: Record<CapabilityId, number> = {
  'simple-organization': 0,
  'money-management': 1,
  'fiscal-hosting': 2,
};

const capabilityCards: Array<{
  id: CapabilityId;
  titleMsgKey: keyof typeof messages;
  descriptionMsgKey: keyof typeof messages;
  icon: 'simple' | 'money' | 'hosting';
}> = [
  {
    id: 'simple-organization',
    titleMsgKey: 'cardSimpleTitle',
    descriptionMsgKey: 'cardSimpleDescription',
    icon: 'simple',
  },
  {
    id: 'money-management',
    titleMsgKey: 'cardMoneyTitle',
    descriptionMsgKey: 'cardMoneyDescription',
    icon: 'money',
  },
  {
    id: 'fiscal-hosting',
    titleMsgKey: 'cardHostingTitle',
    descriptionMsgKey: 'cardHostingDescription',
    icon: 'hosting',
  },
];

const FiscalHosting = ({ collective, account }) => {
  const intl = useIntl();
  const { showConfirmationModal } = useModal();
  const { data, loading: isLoadingHostQuery } = useQuery(fiscalHostingQuery, {
    variables: { id: account.id },
    context: API_V2_CONTEXT,
  });

  const hasMoneyManagement = hasAccountMoneyManagement(account);
  const hasHosting = hasAccountHosting(account);

  const totalHostedAccounts = data?.host?.totalHostedAccounts;

  const refetchAdminPanelMutationParams = {
    refetchQueries: [
      {
        query: editCollectivePageQuery,
        variables: {
          slug: collective.slug,
        },
      },
    ],
  };
  const [editMoneyManagementAndHosting, { loading: isSavingCapabilities }] = useMutation(
    editMoneyManagementAndHostingMutation,
    {
      ...refetchAdminPanelMutationParams,
      context: API_V2_CONTEXT,
    },
  );

  const [pendingSelection, setPendingSelection] = React.useState<CapabilityId | null>(null);

  const currentCapability: CapabilityId = hasHosting
    ? 'fiscal-hosting'
    : hasMoneyManagement
      ? 'money-management'
      : 'simple-organization';

  const renderIcon = (type: CapabilityId, isSelected: boolean) => {
    const baseIconStyles = 'flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-700';
    const activeIconStyles = isSelected ? 'bg-white text-blue-700 shadow-sm' : '';

    if (type === 'simple-organization') {
      return (
        <div className={`${baseIconStyles} ${activeIconStyles}`} aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 20V9.5C5 8.94772 5.44772 8.5 6 8.5H10.5V6.5H8C7.44772 6.5 7 6.05228 7 5.5V4.5C7 3.94772 7.44772 3.5 8 3.5H16C16.5523 3.5 17 3.94772 17 4.5V5.5C17 6.05228 16.5523 6.5 16 6.5H13.5V8.5H18C18.5523 8.5 19 8.94772 19 9.5V20"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M4 20H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M9.5 13.5H11.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.5 16.5H14.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    }

    if (type === 'money-management') {
      return (
        <div className={`${baseIconStyles} ${activeIconStyles}`} aria-hidden>
          <Image src="/static/images/welcome/jar.png" alt="" width={42} height={40} />
        </div>
      );
    }

    return (
      <div className={`${baseIconStyles} ${activeIconStyles}`} aria-hidden>
        <Image src="/static/images/welcome/place.png" alt="" width={42} height={40} />
      </div>
    );
  };

  const moneyFeatures = [
    { id: 'balance', message: featureMessages.balance },
    { id: 'contributions', message: featureMessages.contributions },
    { id: 'expenses', message: featureMessages.expenses },
    { id: 'projects-events', message: featureMessages.projectsEvents },
  ];

  const hostingFeatures = [
    {
      id: 'host-collectives',
      message: featureMessages.hostCollectives,
      children: [
        { id: 'host-balance', message: featureMessages.hostBalance },
        { id: 'host-contributions', message: featureMessages.hostContributions },
        { id: 'host-expenses', message: featureMessages.hostExpenses },
      ],
    },
    { id: 'funds', message: featureMessages.funds },
  ];

  const renderFeatureList = ({
    isGain,
    items,
    color,
  }: {
    isGain: boolean;
    items: Array<{ id: string; message: any; children?: Array<{ id: string; message: any }> }>;
    color: 'green' | 'red';
  }) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            color === 'green' ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'
          }`}
          aria-hidden
        >
          {color === 'green' ? '+' : '-'}
        </span>
        <span>{isGain ? intl.formatMessage(messages.featuresGain) : intl.formatMessage(messages.featuresLose)}</span>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-gray-800">
        {items.map(item => (
          <li key={item.id} className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <span className={`mt-2 h-2.5 w-2.5 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="leading-relaxed">{intl.formatMessage(item.message)}</span>
            </div>
            {item.children && (
              <ul className="ml-7 flex flex-col gap-2 text-sm text-gray-700">
                {item.children.map(child => (
                  <li key={child.id} className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-2.5 w-2.5 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span className="leading-relaxed">{intl.formatMessage(child.message)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  const performCapabilityChange = async (capability: CapabilityId) => {
    setPendingSelection(capability);
    try {
      if (capability === 'simple-organization') {
        await editMoneyManagementAndHosting({
          variables: { organization: { slug: collective.slug }, hasMoneyManagement: false, hasHosting: false },
        });
        return;
      }

      if (capability === 'money-management') {
        if (hasHosting) {
          if (totalHostedAccounts > 0) {
            return;
          }

          await editMoneyManagementAndHosting({
            variables: { organization: { slug: collective.slug }, hasHosting: false },
          });
          return;
        }

        if (!hasMoneyManagement) {
          await editMoneyManagementAndHosting({
            variables: { organization: { slug: collective.slug }, hasMoneyManagement: true },
          });
        }
        return;
      }

      if (capability === 'fiscal-hosting') {
        if (!hasMoneyManagement) {
          await editMoneyManagementAndHosting({
            variables: { organization: { slug: collective.slug }, hasMoneyManagement: true, hasHosting: true },
          });
          return;
        }

        if (!hasHosting) {
          await editMoneyManagementAndHosting({
            variables: { organization: { slug: collective.slug }, hasHosting: true },
          });
        }
      }
    } finally {
      setPendingSelection(null);
    }
  };

  const openCapabilityModal = (capability: CapabilityId) => {
    if (isSavingCapabilities || isLoadingHostQuery || capability === currentCapability) {
      return;
    }

    const currentWeight = capabilityRank[currentCapability];
    const targetWeight = capabilityRank[capability];
    const isUpgrade = targetWeight > currentWeight;

    const getItemsForChange = () => {
      const upgradingFromSimple = currentCapability === 'simple-organization';
      const upgradingToHosting = capability === 'fiscal-hosting';

      if (isUpgrade) {
        if (upgradingFromSimple && capability === 'money-management') {
          return moneyFeatures;
        }
        if (upgradingFromSimple && upgradingToHosting) {
          return [...moneyFeatures, ...hostingFeatures];
        }
        if (currentCapability === 'money-management' && upgradingToHosting) {
          return hostingFeatures;
        }
      }

      const downgradingFromHosting = currentCapability === 'fiscal-hosting';
      const downgradingToSimple = capability === 'simple-organization';

      if (!isUpgrade) {
        if (downgradingFromHosting && capability === 'money-management') {
          return hostingFeatures;
        }
        if (downgradingFromHosting && downgradingToSimple) {
          return [...moneyFeatures, ...hostingFeatures];
        }
        if (currentCapability === 'money-management' && downgradingToSimple) {
          return moneyFeatures;
        }
      }

      return moneyFeatures;
    };
    const titleDescriptor =
      capability === 'fiscal-hosting'
        ? messages.modalTitleHosting
        : capability === 'money-management'
          ? messages.modalTitleMoney
          : messages.modalTitleSimple;

    const items = getItemsForChange();

    showConfirmationModal({
      className: 'max-w-xl p-6 sm:rounded-xl',
      title: intl.formatMessage(titleDescriptor),
      description: intl.formatMessage(messages.modalDescription),
      children: renderFeatureList({
        isGain: isUpgrade,
        items,
        color: isUpgrade ? 'green' : 'red',
      }),
      cancelLabel: <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />,
      confirmLabel: <FormattedMessage id="confirm" defaultMessage="Confirm" />,
      onConfirm: () => performCapabilityChange(capability),
    });
  };

  return (
    <div className="mb-10 flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <SettingsSectionTitle className="mb-0 text-2xl">
            <FormattedMessage id="FiscalHosting.Functionalities" defaultMessage="Manage Capabilities" />
          </SettingsSectionTitle>
          <div className="hidden h-px flex-1 bg-gray-200 md:block" aria-hidden />
        </div>
        <p className="text-base text-gray-700 md:max-w-5xl">
          <FormattedMessage
            id="FiscalHosting.Functionalities.description"
            defaultMessage="Making financial contributions or getting paid are basic platform functionalities. Activate additional capabilities to do more on the platform."
          />
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {capabilityCards.map(option => {
          const isSelected = option.id === currentCapability;
          const isBusy = pendingSelection === option.id || isSavingCapabilities || isLoadingHostQuery;

          return (
            <button
              key={option.id}
              type="button"
              data-cy={`${option.id}-card`}
              onClick={() => openCapabilityModal(option.id)}
              disabled={isBusy}
              className={`relative flex h-full flex-col gap-3 rounded-2xl border px-6 py-6 text-left transition duration-150 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-[0_14px_45px_rgba(62,94,246,0.18)]'
                  : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:shadow-lg'
              } ${isBusy ? 'opacity-70' : ''}`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <span className="absolute top-5 right-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.5 10.5L4 8l1-1 1.5 1.5L11 4l1 1-5.5 5.5z" fill="currentColor" />
                  </svg>
                </span>
              )}

              {renderIcon(option.id, isSelected)}

              <div className="pr-8">
                <h3 className="text-base font-semibold text-gray-900">
                  {intl.formatMessage(messages[option.titleMsgKey])}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                  {intl.formatMessage(messages[option.descriptionMsgKey])}
                </p>
              </div>

              {isBusy && <span className="absolute inset-0 rounded-2xl" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FiscalHosting;
