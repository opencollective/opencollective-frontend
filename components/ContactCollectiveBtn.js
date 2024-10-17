import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import ContactCollectiveModal from './ContactCollectiveModal';
import StyledButton from './StyledButton';

const DefaultContactCollectiveButton = props => (
  <StyledButton {...props}>
    <FormattedMessage id="Contact" defaultMessage="Contact" />
  </StyledButton>
);

const ContactCollectiveBtn = ({ children = DefaultContactCollectiveButton, collective, LoggedInUser }) => {
  const [showModal, setShowModal] = React.useState(false);
  const router = useRouter();
  const isOpenCollective = collective.slug === 'opencollective';
  return (
    <Fragment>
      {children({
        onClick: () =>
          isOpenCollective
            ? router.push('/help')
            : LoggedInUser
              ? setShowModal(true)
              : router.push(`/${collective.slug}/contact`),
      })}
      {showModal && <ContactCollectiveModal collective={collective} onClose={() => setShowModal(null)} />}
    </Fragment>
  );
};

ContactCollectiveBtn.propTypes = {
  children: PropTypes.func.isRequired,
  collective: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object,
};

export default ContactCollectiveBtn;
