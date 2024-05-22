import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../Grid';
import Image from '../Image';
import StyledModal, { ModalBody, ModalHeader } from '../StyledModal';
import { P } from '../Text';

type WhyPlatformTipModalProps = {
  onClose: () => void;
};
export function WhyPlatformTipModal(props: WhyPlatformTipModalProps) {
  return (
    <StyledModal width="490px" onClose={props.onClose}>
      <ModalHeader>
        <Flex alignItems="center" gap="12px" mr="20px">
          <Image alt="Open Collective" src="/static/images/opencollective-icon.png" width={64} height={64} />
          <FormattedMessage defaultMessage="Help make the platform better for everyone." id="PiLm3v" />
        </Flex>
      </ModalHeader>
      <ModalBody>
        <div className="relative">
          <Image
            alt="Open Collective Team"
            src="/static/images/oc-team-2023.png"
            width="440"
            height="293"
            style={{
              borderRadius: '25px',
            }}
          />
        </div>
        <P mt={3} fontSize="16px" lineHeight="24px">
          <FormattedMessage
            defaultMessage="At Open Collective, we work every day to make sure that our platform is a safe and simple place for collectives to grow.<br></br>This includes introducing new and exciting features, fixing bugs, and making sure that it works the way our users expect.<br></br>Your platform tip will go towards helping us maintain that work - and ensuring that collectives all over the world have access to the tools they need to make communities better, and make change happen."
            id="ym6cRo"
            values={{
              br: () => (
                <span>
                  <br />
                  <br />
                </span>
              ),
            }}
          />
        </P>
        <P mt={3} fontSize="16px" lineHeight="24px" fontWeight="800">
          <FormattedMessage
            defaultMessage="Collectives use Open Collective's crowdfunding technology for free! We have a 0% platform fee on incoming funds."
            id="Onqdsz"
          />
        </P>
      </ModalBody>
    </StyledModal>
  );
}
