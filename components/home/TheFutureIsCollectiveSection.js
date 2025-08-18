import React, { Fragment, useState } from 'react';
import { RightArrow } from '@styled-icons/boxicons-regular/RightArrow';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import Link from '../Link';
import { MainDescription } from '../marketing/Text';
import StyledButton from '../StyledButton';
import StyledModal from '../StyledModal';
import { Span } from '../Text';

const TheFutureIsCollective = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <Fragment>
      <div className="mt-20 flex items-center justify-center px-4">
        <div className="flex max-w-6xl flex-col items-center" flexDirection="column" alignItems="center">
          <div>
            <h1 className="text-center text-5xl font-bold tracking-tight text-balance text-oc sm:text-6xl md:text-7xl md:font-extrabold">
              <FormattedMessage
                id="home.collaborativeMoneyManagement"
                defaultMessage="Collaborative Money Management"
              />
            </h1>
          </div>
          <div className="my-4 max-w-4xl sm:my-10">
            {/* maxWidth={['288px', '608px', '768px', null, '896px']} */}
            <MainDescription textAlign="center">
              <FormattedMessage
                id="home.collaborativeMoneyManagement.description"
                defaultMessage="Open Collective provides organizations and groups with <b>participatory financial infrastructure</b>. When people can see where money comes from and where it goes, <b>trust can be built.</b> Trust paves the way for increased <b>financial collaboration and coordination.</b>"
                values={{
                  b: I18nBold,
                }}
              />
            </MainDescription>
          </div>

          <NextIllustration
            display={[null, 'none']}
            width={320}
            height={589}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration-mobile.png"
          />
          <NextIllustration
            display={['none', 'block', 'none']}
            width={768}
            height={431}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration.png"
          />
          <NextIllustration
            display={['none', null, 'block', null, 'none']}
            width={978}
            height={610}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration.png"
          />
          <NextIllustration
            display={['none', null, null, null, 'block']}
            width={1014}
            height={619}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration.png"
          />
        </div>
      </div>
      {showModal && (
        <StyledModal
          padding="0"
          background="transparent"
          width={[1, null, '670px', null, '770px']}
          onClose={() => setShowModal(false)}
        >
          <Container display="flex" width={1} height={400} maxWidth={712} background="black">
            <iframe
              title="YouTube video"
              width="100%"
              height="400px"
              src="https://www.youtube-nocookie.com/embed/IBU5fSILAe8"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Container>
        </StyledModal>
      )}
    </Fragment>
  );
};

export default TheFutureIsCollective;
