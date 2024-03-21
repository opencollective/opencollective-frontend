import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form, FormikProps } from 'formik';
import { get, sum } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { editCollectivePageQuery } from '../../lib/graphql/v1/queries';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { FormikZod } from '../FormikZod';
import I18nFormatters from '../I18nFormatters';
import Loading from '../Loading';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import RichTextEditor from '../RichTextEditor';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { Button } from '../ui/Button';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { useToast } from '../ui/useToast';

const leaveHostMutation = gql`
  mutation LeaveHost($account: AccountReferenceInput!, $pauseContributions: Boolean!, $messageForContributors: String) {
    removeHost(
      account: $account
      pauseContributions: $pauseContributions
      messageForContributors: $messageForContributors
    ) {
      id
      ... on AccountWithHost {
        host {
          id
        }
      }
    }
  }
`;

const leaveHostQuery = gql`
  query AccountInfoForLeaveHost($slug: String) {
    account(slug: $slug, throwIfMissing: true) {
      id
      type
      currency
      name
      stats {
        activeRecurringContributionsBreakdown {
          label
          count
          amount {
            valueInCents
            currency
          }
        }
      }
    }
  }
`;

const LeaveHostFormSchema = z.object({
  accountId: z.string(),
});

const LeaveHostFormSchemaWithRecurringContributions = LeaveHostFormSchema.merge(
  z.object({
    messageForContributors: z.string().min(20).max(2000),
    pauseContributions: z.boolean(),
  }),
);

const getPortabilitySummary = (
  account,
): {
  totalCount: number;
  yearlyAmount: number;
} => {
  const allStats = get(account, 'stats.activeRecurringContributionsBreakdown', []);
  if (!allStats.length) {
    return { totalCount: 0, yearlyAmount: 0 };
  }

  const totalCount = sum(allStats.map(({ count }) => count));
  const yearlyAmount = allStats.reduce((acc, { label, amount }) => {
    if (label === 'yearly') {
      return acc + amount.valueInCents;
    } else if (label === 'monthly') {
      return acc + amount.valueInCents * 12;
    }
  }, 0);

  return { totalCount, yearlyAmount };
};

export const LeaveHostModal = ({ account, host, onClose }) => {
  const variables = { slug: account.slug };
  const { toast } = useToast();
  const intl = useIntl();
  const { loading, error, data } = useQuery(leaveHostQuery, { variables, context: API_V2_CONTEXT });
  const [removeHost, { loading: submitting }] = useMutation(leaveHostMutation, { context: API_V2_CONTEXT });
  const portabilitySummary = getPortabilitySummary(data?.account);
  return (
    <StyledModal width="570px" onClose={onClose}>
      <ModalHeader onClose={onClose} mb={3}>
        <FormattedMessage id="collective.editHost.leave" values={{ name: host.name }} defaultMessage="Leave {name}" />
      </ModalHeader>
      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <FormikZod
          schema={portabilitySummary.totalCount ? LeaveHostFormSchemaWithRecurringContributions : LeaveHostFormSchema}
          initialValues={
            {
              accountId: data.account.id,
              messageForContributors: '',
              pauseContributions: true,
            } as z.infer<typeof LeaveHostFormSchemaWithRecurringContributions>
          }
          onSubmit={async (values: z.infer<typeof LeaveHostFormSchemaWithRecurringContributions>) => {
            try {
              await removeHost({
                variables: {
                  account: { id: values.accountId },
                  pauseContributions: values.pauseContributions,
                  messageForContributors: values.messageForContributors,
                },
                refetchQueries: [
                  {
                    query: editCollectivePageQuery,
                    variables: { slug: account.slug },
                  },
                ],
              });
              toast({
                variant: 'success',
                message: intl.formatMessage(
                  { defaultMessage: '{hostName} is no longer the Fiscal Host for {collectiveName}' },
                  { hostName: host.name, collectiveName: account.name },
                ),
              });
              onClose();
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          {({ values, setFieldValue }: FormikProps<z.infer<typeof LeaveHostFormSchemaWithRecurringContributions>>) => (
            <Form>
              <ModalBody>
                <div className="mt-3 ">
                  <p className="mb-3 text-sm">
                    <FormattedMessage
                      id="editCollective.host.change.removeFirst"
                      defaultMessage="Without a Fiscal Host, {type, select, COLLECTIVE {your Collective} FUND {your Fund} other {}} won't be able to accept financial contributions. You will be able to apply to another Fiscal Host."
                      values={{ type: account.type }}
                    />
                  </p>
                  {Boolean(portabilitySummary.totalCount) && (
                    <div>
                      <p className="mb-3 text-sm">
                        <FormattedMessage
                          defaultMessage="{accountName} currently has {count, plural, one {# active recurring contribution} other {# active recurring contributions}} ({yearlyAmount})."
                          values={{
                            accountName: <strong>{account.name}</strong>,
                            count: portabilitySummary.totalCount,
                            yearlyAmount: (
                              <FormattedMoneyAmount
                                amountStyles={null}
                                amount={portabilitySummary.yearlyAmount}
                                interval="year"
                                currency={account.currency}
                              />
                            ),
                          }}
                        />{' '}
                        <FormattedMessage defaultMessage="Select what you want to do:" />
                      </p>
                      <RadioGroup
                        value={values.pauseContributions ? 'pause' : 'cancel'}
                        className="space-y-3"
                        onValueChange={value => setFieldValue('pauseContributions', value === 'pause')}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="self-baseline">
                            <RadioGroupItem value="pause" id="pause" />
                          </div>
                          <label className="text-sm font-normal" htmlFor="pause">
                            <FormattedMessage
                              defaultMessage="I want to <strong>pause</strong> recurring contributions"
                              values={I18nFormatters}
                            />
                            <p className="pt-1 text-sm text-gray-700">
                              <FormattedMessage defaultMessage="Select this option if you intend to stay on Open Collective (either with another fiscal host or as an independent collective). We will pause all recurring contributions and notify your contributors that they can renew them as soon as you are ready." />
                            </p>
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="self-baseline">
                            <RadioGroupItem value="cancel" id="cancel" />
                          </div>
                          <label className="text-sm font-normal" htmlFor="cancel">
                            <FormattedMessage
                              defaultMessage="I want to <strong>cancel</strong> all the recurring contributions"
                              values={I18nFormatters}
                            />
                            <p className="pt-1 text-sm text-gray-700">
                              <FormattedMessage defaultMessage="Select this option if you intend to leave Open Collective and you want to cancel all recurring contributions. We will notify your contributors that their recurring contributions have been canceled." />
                            </p>
                          </label>
                        </div>
                      </RadioGroup>
                      <StyledInputFormikField
                        name="messageForContributors"
                        labelProps={{ fontWeight: 'bold' }}
                        label={intl.formatMessage({ defaultMessage: 'Additional message for contributors' })}
                        mt={4}
                        required
                        hint={intl.formatMessage({
                          defaultMessage:
                            'Use this to communicate with your contributors about the reason of this change. If leaving Open Collective, you can also provide instructions on how to continue supporting your collective.',
                        })}
                        hintPosition="above"
                      >
                        {({ field }) => (
                          <RichTextEditor
                            id={field.id}
                            inputName={field.name}
                            showCount
                            version="simplified"
                            onChange={field.onChange}
                            editorMaxHeight={300}
                            withBorders
                            editorMinHeight={150}
                            maxLength={2000}
                            placeholder={
                              values.pauseContributions
                                ? intl.formatMessage({ defaultMessage: 'We are transitioning to a new fiscal host.' })
                                : intl.formatMessage({
                                    defaultMessage:
                                      'We are leaving Open Collective. You can continue supporting us through our website.',
                                  })
                            }
                          />
                        )}
                      </StyledInputFormikField>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex w-full justify-end gap-3">
                  <Button variant="outline" type="reset" onClick={onClose}>
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    loading={submitting}
                    data-cy="continue"
                    className="min-w-[100px]"
                    disabled={portabilitySummary.totalCount && !values.messageForContributors}
                  >
                    <FormattedMessage
                      id="collective.editHost.leave"
                      values={{ name: host.name }}
                      defaultMessage="Leave {name}"
                    />
                  </Button>
                </div>
              </ModalFooter>
            </Form>
          )}
        </FormikZod>
      )}
    </StyledModal>
  );
};
