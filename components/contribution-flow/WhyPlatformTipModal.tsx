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
          <FormattedMessage defaultMessage="Why add a platform contribution?" id="platformTip.whyModalTitle" />
        </Flex>
      </ModalHeader>
      <ModalBody>
        <div className="relative">
          <Image
            alt="OFi Consortium Team"
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
            defaultMessage="OFi Consortium is the community-governed non-profit that operates and maintains the Open Collective platform.<br></br>This contribution goes to the platform, not to the collective you are supporting. It helps fund infrastructure, support, security, maintenance, and product work, so collectives around the world can keep using Open Collective."
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
            <FormattedMessage defaultMessage="About OFi Consortium" id="aboutOFiCo" /> →
          </StyledLink>
        </P>
      </ModalBody>
    </StyledModal>
  );
}
