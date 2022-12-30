import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { matchPm, PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';
import { PaymentMethod } from '../../lib/graphql/types/v2/graphql';
import { paymentMethodLabelWithIcon } from '../../lib/payment_method_label';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';

type EditPaymentMethodProps = {
  collectiveSlug: string;
  isSaving: boolean;
  needsConfirmation: boolean;
  nbActiveSubscriptions: number;
  paymentMethod: PaymentMethod;
  onConfirm: (paymentMethod: PaymentMethod) => void;
  onRemove: (paymentMethod: PaymentMethod) => void;
};

const EditPaymentMethod = ({
  collectiveSlug,
  paymentMethod,
  isSaving,
  nbActiveSubscriptions,
  needsConfirmation,
  onConfirm,
  onRemove,
}: EditPaymentMethodProps) => {
  const intl = useIntl();
  const isStripeCreditCard = matchPm(paymentMethod, PAYMENT_METHOD_SERVICE.STRIPE, PAYMENT_METHOD_TYPE.CREDITCARD);
  const canRemove = !nbActiveSubscriptions && isStripeCreditCard;
  const hasActions = canRemove || nbActiveSubscriptions || needsConfirmation;

  return (
    <div>
      <Flex flexDirection={['column-reverse', null, 'row']}>
        <Flex alignItems="center" css={{ flexGrow: 1 }}>
          <Box minWidth="150px" as="label">
            <FormattedMessage
              id="paymentMethod.typeSelect"
              values={{ type: paymentMethod.type.toLowerCase() }}
              defaultMessage="{type, select, giftcard {Gift card} creditcard {Credit card} prepaid {Prepaid} other {}}"
            />
          </Box>
          <Box>
            <Box mb={2}>{paymentMethodLabelWithIcon(intl, paymentMethod)}</Box>
            {Boolean(nbActiveSubscriptions) && (
              <FormattedMessage
                id="paymentMethod.activeSubscriptions"
                defaultMessage="{n} active {n, plural, one {recurring financial contribution} other {recurring financial contributions}}"
                values={{ n: nbActiveSubscriptions }}
              />
            )}
          </Box>
        </Flex>
        {hasActions && (
          <Flex
            mb={[3, 2, 0]}
            justifyContent={['center', null, 'flex-end']}
            alignItems={['center', null, 'flex-start']}
            css={{ minWidth: 230 }}
          >
            {Boolean(nbActiveSubscriptions) && (
              <Link href={`/${collectiveSlug}/manage-contributions`}>
                <StyledButton buttonSize="medium" mx={1} disabled={isSaving}>
                  <FormattedMessage
                    id="paymentMethod.editSubscriptions"
                    defaultMessage="Edit recurring financial contributions"
                  />
                </StyledButton>
              </Link>
            )}
            {needsConfirmation && (
              <StyledButton
                disabled={isSaving}
                buttonStyle="warningSecondary"
                buttonSize="medium"
                onClick={() => onConfirm(paymentMethod)}
                mx={1}
              >
                <FormattedMessage id="paymentMethod.confirm" defaultMessage="Confirm" />
              </StyledButton>
            )}
            {canRemove && (
              <StyledButton
                disabled={isSaving}
                buttonStyle="standard"
                buttonSize="medium"
                onClick={() => onRemove(paymentMethod)}
                mx={1}
              >
                <FormattedMessage id="Remove" defaultMessage="Remove" />
              </StyledButton>
            )}
          </Flex>
        )}
      </Flex>
    </div>
  );
};

export default EditPaymentMethod;
