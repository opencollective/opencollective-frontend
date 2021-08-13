import React from 'react';
import PropTypes from 'prop-types';
import { Link as IconLink } from '@styled-icons/feather/Link';
import QRCode from 'qrcode.react';
import { FormattedMessage } from 'react-intl';

import useClipboard from '../../lib/hooks/useClipboard';

import Container from '../Container';
import { Box } from '../Grid';
import StyledButton from '../StyledButton';
import { P, Span } from '../Text';

const StepCheckout = ({ stepDetails, order }) => {
  const { isCopied, copy } = useClipboard();

  return (
    <Container width={1}>
      <Box textAlign={['center']}>
        <FormattedMessage
          id="NewContribute.crypto.donationDescription"
          defaultMessage="Use the address below to donate {amount} from your wallet"
          values={{
            amount: (
              <span style={{ color: 'black.900' }}>
                <b>
                  {stepDetails.amount} {stepDetails.currency.value}
                </b>
              </span>
            ),
          }}
        />
        {order?.paymentMethod?.data?.depositAddress && (
          <React.Fragment>
            <QRCode
              value={order.paymentMethod.data.depositAddress}
              imageSettings={{
                src: `/static/images/crypto-logos/${stepDetails.currency.value}.svg`,
                height: 40,
                width: 40,
                excavate: true,
              }}
              renderAs="svg"
              size={256}
              level="L"
              includeMargin
            />
            <P mb="16px">{order.paymentMethod.data.depositAddress}</P>
            <StyledButton onClick={() => copy(window.location.href)} disabled={isCopied}>
              <Span mr={1}>
                <FormattedMessage
                  id="NewContribute.crypto.QRCodeCopyButton"
                  defaultMessage="Click to copy wallet address"
                />
              </Span>
              <IconLink size="20px" />
            </StyledButton>
          </React.Fragment>
        )}
      </Box>
    </Container>
  );
};

StepCheckout.propTypes = {
  stepDetails: PropTypes.object,
  order: PropTypes.object,
};

export default StepCheckout;
