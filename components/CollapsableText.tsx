import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'lodash';
import { FormattedMessage } from 'react-intl';

import StyledLink from './StyledLink';

const CollapsableText = ({ text, maxLength }) => {
  const [isCollapsed, setCollapsed] = React.useState(true);
  if (!text) {
    return null;
  } else if (text.length <= maxLength) {
    return <span>{text}</span>;
  } else if (isCollapsed) {
    return (
      <span>
        {truncate(text, { length: maxLength })}{' '}
        <StyledLink
          href="#"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setCollapsed(false);
          }}
        >
          <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
        </StyledLink>
      </span>
    );
  } else {
    return (
      <span>
        {text}{' '}
        <StyledLink
          href="#"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setCollapsed(true);
          }}
        >
          <FormattedMessage id="Hide" defaultMessage="Hide" />
        </StyledLink>
      </span>
    );
  }
};

CollapsableText.propTypes = {
  maxLength: PropTypes.number.isRequired,
  text: PropTypes.string,
};

export default CollapsableText;
