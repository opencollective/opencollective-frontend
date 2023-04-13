import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from './Container';
import StyledButton from './StyledButton';
import StyledUpdate from './StyledUpdate';

const LoadingContainer = styled.div`
  color: #797d7f;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  letter-spacing: 3px;
  font-weight: bold;
  z-index: 10;
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(5px);
`;

class Updates extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    updates: PropTypes.object,
    fetchMore: PropTypes.func,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.fetchMore = this.fetchMore.bind(this);
    this.state = { loading: false, isPayActionLocked: false };
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
    });
  }

  setPayActionLock(val) {
    this.setState({ isPayActionLocked: val });
  }

  render() {
    const { collective, updates } = this.props;
    const showLoadMore = updates?.nodes.length < updates?.totalCount;

    if (!updates) {
      return <div />;
    }

    return (
      <div className="Updates">
        <Container position="relative" border="1px solid #e6e8eb" borderRadius={5} data-cy="updatesList">
          {this.state.loading && (
            <LoadingContainer>
              <FormattedMessage id="loading" defaultMessage="loading" />
            </LoadingContainer>
          )}
          {updates.nodes.map((update, index) => (
            <Container key={update.id} padding="0">
              <StyledUpdate
                update={update}
                collective={collective}
                compact={true}
                borderTop={index !== 0 ? '1px solid #e6e8eb' : 'none'}
              />
            </Container>
          ))}
          {updates.nodes.length === 0 && (
            <Container color="black.700" p={4}>
              <FormattedMessage id="updates.empty" defaultMessage="No Updates" />
            </Container>
          )}
        </Container>
        {showLoadMore && (
          <Container margin="1rem" textAlign="center">
            <StyledButton onClick={this.fetchMore} textTransform="capitalize">
              {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
              {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
            </StyledButton>
          </Container>
        )}
      </div>
    );
  }
}

export default Updates;
