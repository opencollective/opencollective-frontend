import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import { Box } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Link from '../../Link';
import MessageBox from '../../MessageBox';

const HostMetrics = props => {
  return (
    <Box>
      <MessageBox type="info" withIcon>
        <FormattedMessage
          defaultMessage="We have moved host metrics to a <Link>brand new dashboard</Link>. This section will be removed soon."
          values={{
            Link: getI18nLink({
              as: Link,
              href: `/${props.collective.slug}/admin/reports`,
            }),
          }}
        />
      </MessageBox>
    </Box>
  );
};

HostMetrics.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
};

export default injectIntl(HostMetrics);
