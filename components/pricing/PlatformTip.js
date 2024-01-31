import React from 'react';
import { FormattedMessage } from 'react-intl';

import Illustration from '../collectives/HomeIllustration';
import Container from '../Container';
import { getI18nLink, I18nBold } from '../I18nFormatters';
import { P } from '../Text';

const PlatformTip = ({ ...props }) => (
  <Container
    my="16px"
    display="flex"
    alignItems="center"
    padding="12px 16px"
    border="1px solid #C2E2FF"
    borderRadius="8px"
    {...props}
  >
    <Illustration src="/static/images/pricing/platform-tip.svg" />
    <P fontSize="12px" lineHeight="18px" color="black.800">
      <FormattedMessage
        id="pricing.platformTips"
        defaultMessage="<strong>Platform Tips</strong><br></br>Doohi Collective is supported by voluntary contributions called Platform Tips, optionally added at checkout, which enable us to keep building the software without charging Collectives directly."
        values={{
          a: getI18nLink({
            href: 'https://docs.opencollective.com/help/financial-contributors/financial-contributors',
            openInNewTab: true,
          }),
          strong: I18nBold,
          // eslint-disable-next-line react/display-name
          br: () => <br />,
        }}
      />
    </P>
  </Container>
);

export default PlatformTip;
