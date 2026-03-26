import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../Grid';
import Image from '../Image';
import StyledLink from '../StyledLink';
import StyledModal, { ModalBody, ModalHeader } from '../StyledModal';
import { P } from '../Text';

type WhyPlatformTipModalProps = {
  onClose: () => void;
};
export function WhyPlatformTipModal(props: WhyPlatformTipModalProps) {
  return (
    <StyledModal onClose={props.onClose}>
      <ModalHeader>
        <Flex alignItems="center" gap="12px" mr="20px">
          <Image alt="Open Collective" src="/static/images/opencollective-icon.png" width={64} height={64} />
          <FormattedMessage defaultMessage="Help us keep the Open Collective platform sustainable." id="platformTip.helperText" />
        </Flex>
      </ModalHeader>
      <ModalBody>
        <div className="relative">
          <Image
            alt="Open Finance Consortium Team"
            src="/static/images/ofico-team.jpeg"
            width="440"
            height="293"
            style={{
              borderRadius: '25px',
            }}
          />
        </div>
        <P mt={3} fontSize="16px" lineHeight="24px">
          <FormattedMessage
            defaultMessage="Open Finance Consortium is a community-governed non-profit that builds and maintains the platform.<br></br>Your platform tip will go towards helping us maintain that work - and ensuring that collectives all over the world have access to the tools they need to make communities better, and make change happen."
            id="oFiCoWhyModal"
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
        <P mt={3} fontSize="16px" lineHeight="24px">
          <StyledLink href="https://oficonsortium.org/" openInNewTab>
            <FormattedMessage defaultMessage="About Open Finance Consortium" id="aboutOFiCo" /> →
          </StyledLink>
        </P>
      </ModalBody>
    </StyledModal>
  );
}
