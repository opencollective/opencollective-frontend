import React, { Fragment } from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { get, pick } from 'lodash-es';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../lib/currency-utils';
import { gql } from '../lib/graphql/helpers';
import type { Currency } from '../lib/graphql/types/v2/graphql';
import { collectiveBalanceFragment } from '../lib/graphql/v1/fragments';
import type LoggedInUser from '../lib/LoggedInUser';
import { compose } from '../lib/utils';
import injectIntl from '@/lib/injectIntl';

import { Button } from './ui/Button';
import { toast } from './ui/useToast';
import { Flex } from './Grid';

type SendMoneyCollective = Parameters<LoggedInUser['isAdminOfCollectiveOrHost']>[0] & {
  id?: number | string;
  name?: string;
};

type SendMoneyToCollectiveBtnProps = {
  amount: number;
  currency: Currency;
  description?: string;
  fromCollective: SendMoneyCollective;
  toCollective: SendMoneyCollective;
  LoggedInUser: LoggedInUser;
  /** Injected by `injectIntl` */
  intl?: IntlShape;
  data?: {
    account?: {
      id?: string;
      paymentMethods?: Array<{ id: string; service?: string; name?: string }>;
    };
  };
  sendMoneyToCollective?: (
    options: Record<string, unknown>,
  ) => Promise<{ data?: { createOrder?: { order?: unknown } } }>;
  confirmTransfer?: () => void;
  isTransferApproved?: boolean;
  customButton?: (props: { onClick: () => void; children: React.ReactNode }) => React.ReactNode;
};

type SendMoneyToCollectiveBtnState = {
  loading?: boolean;
};

class SendMoneyToCollectiveBtn extends React.Component<SendMoneyToCollectiveBtnProps, SendMoneyToCollectiveBtnState> {
  constructor(props: SendMoneyToCollectiveBtnProps) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {};
  }

  componentDidUpdate(prevProps: SendMoneyToCollectiveBtnProps) {
    if (this.props.isTransferApproved !== prevProps.isTransferApproved) {
      this.onClick();
    }
  }

  async onClick() {
    const { currency, amount, fromCollective, toCollective, description, data, LoggedInUser } = this.props;
    if (!LoggedInUser || !LoggedInUser.isAdminOfCollectiveOrHost(fromCollective) || !get(data, 'account')) {
      return;
    }
    const paymentMethods = get(data, 'account.paymentMethods');
    if (!paymentMethods || paymentMethods.length === 0) {
      toast({
        variant: 'error',
        message: (
          <FormattedMessage defaultMessage="We couldn't find a payment method to make this transaction" id="+H8kCF" />
        ),
      });
      return;
    }
    this.setState({ loading: true });
    const order = {
      amount: { valueInCents: amount, currency },
      toAccount: pick(toCollective, ['slug']),
      fromAccount: pick(fromCollective, ['slug']),
      description,
      paymentMethod: { id: paymentMethods[0].id },
      frequency: 'ONETIME',
      isBalanceTransfer: true,
    };
    try {
      await this.props.sendMoneyToCollective({
        variables: { order },
        // We need to update the store manually because the response comes from API V2
        update: (store, { data: { createOrder } }) => {
          const balance = createOrder.order.fromAccount.stats.balance.valueInCents;
          store.writeFragment({
            fragment: collectiveBalanceFragment,
            id: `CollectiveStatsType:${fromCollective.id}`,
            data: { id: fromCollective.id, balance },
          });
        },
      });
      toast({
        variant: 'success',
        message: (
          <FormattedMessage
            defaultMessage="Balance sent to {toCollectiveName}"
            id="TSybob"
            values={{ toCollectiveName: toCollective.name }}
          />
        ),
      });
      this.setState({ loading: false });
    } catch (e) {
      this.setState({ loading: false });
      toast({
        variant: 'error',
        message: e.message,
      });
    }
  }

  render() {
    const { amount, currency, toCollective, customButton } = this.props;
    return (
      <div className="SendMoneyToCollectiveBtn">
        <Flex justifyContent="center" mb={1}>
          {customButton ? (
            customButton({
              onClick: this.props.confirmTransfer || this.onClick,
              children: (
                <Fragment>
                  {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
                  {!this.state.loading && (
                    <FormattedMessage
                      id="SendMoneyToCollective.btn"
                      defaultMessage="Send {amount} to {collective}"
                      values={{
                        amount: formatCurrency(amount, currency, { locale: this.props.intl.locale }),
                        collective: toCollective.name,
                      }}
                    />
                  )}
                </Fragment>
              ),
            })
          ) : (
            <Button variant="outline" onClick={this.props.confirmTransfer || this.onClick}>
              {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
              {!this.state.loading && (
                <FormattedMessage
                  id="SendMoneyToCollective.btn"
                  defaultMessage="Send {amount} to {collective}"
                  values={{
                    // TODO: the `locale` string was passed where `formatCurrency` expects options, so it was ignored
                    amount: formatCurrency(amount, currency),
                    collective: toCollective.name,
                  }}
                />
              )}
            </Button>
          )}
        </Flex>
      </div>
    );
  }
}

const paymentMethodsQuery = gql`
  query SendMoneyToCollectivePaymentMethods($slug: String) {
    account(slug: $slug) {
      id
      paymentMethods(service: OPENCOLLECTIVE, type: COLLECTIVE) {
        id
        service
        name
      }
    }
  }
`;

type PaymentMethodsQueryProps = {
  fromCollective?: { slug?: string };
  LoggedInUser?: LoggedInUser;
};

const addPaymentMethodsData = graphql(paymentMethodsQuery, {
  options: (props: PaymentMethodsQueryProps) => ({
    variables: {
      slug: get(props, 'fromCollective.slug'),
    },
  }),
  skip: (props: PaymentMethodsQueryProps) => {
    return !props.LoggedInUser;
  },
});

const sendMoneyToCollectiveMutation = gql`
  mutation SendMoneyToCollective($order: OrderCreateInput!) {
    createOrder(order: $order) {
      order {
        id
        fromAccount {
          id
          stats {
            id
            balance {
              valueInCents
            }
          }
        }
      }
    }
  }
`;

const addSendMoneyToCollectiveMutation = graphql(sendMoneyToCollectiveMutation, {
  name: 'sendMoneyToCollective',
});

const addGraphql = compose(addPaymentMethodsData, addSendMoneyToCollectiveMutation);

export default addGraphql(injectIntl(SendMoneyToCollectiveBtn));
