import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import Image from './Image';
import LoadingPlaceholder from './LoadingPlaceholder';
import StyledUpdate from './StyledUpdate';
import { P } from './Text';

class Updates extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    updates: PropTypes.object,
    loading: PropTypes.bool,
    nbLoadingPlaceholders: PropTypes.number,
  };

  render() {
    const { collective, updates, loading, nbLoadingPlaceholders } = this.props;
    return (
      <div className="Updates">
        <Container position="relative" border="1px solid #e6e8eb" borderRadius={5} data-cy="updatesList">
          {loading ? (
            [...Array(nbLoadingPlaceholders || 5)].map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Container key={index} borderTop={index !== 0 ? '1px solid #e6e8eb' : 'none'} p={3}>
                <LoadingPlaceholder height={75} borderRadius={4} />
              </Container>
            ))
          ) : !updates?.nodes?.length ? (
            <Container color="black.700" p={4} display="flex" flexDirection="column" alignItems="center">
              <Image src="/static/images/not-found-illustration.png" alt="404" width={150} height={150} />
              <P mt={3} fontSize="16px" lineHeight="24px" fontWeight="500" textAlign="center">
                <FormattedMessage id="updates.empty" defaultMessage="No Updates" />
              </P>
            </Container>
          ) : (
            updates.nodes.map((update, index) => (
              <Container key={update.id} borderTop={index !== 0 ? '1px solid #e6e8eb' : 'none'}>
                <StyledUpdate update={update} collective={collective} compact={true} />
              </Container>
            ))
          )}
        </Container>
      </div>
    );
  }
}

export default Updates;
