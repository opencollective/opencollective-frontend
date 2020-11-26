import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import colors from '../lib/constants/colors';

import Container from './Container';
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
    updates: PropTypes.array,
    fetchMore: PropTypes.func,
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
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

    if (!updates) {
      return <div />;
    }

    return (
      <div className="Updates">
        <Container position="relative">
          {this.state.loading && (
            <LoadingContainer>
              <FormattedMessage id="loading" defaultMessage="loading" />
            </LoadingContainer>
          )}
          {updates.map((update, index) => (
            <Container key={update.id} padding="0">
              <StyledUpdate
                update={update}
                collective={collective}
                compact={true}
                borderTop={index === 0 ? undefined : 'none'}
              />
            </Container>
          ))}
          {updates.length === 0 && (
            <Container color={colors.darkgray}>
              <FormattedMessage id="updates.empty" defaultMessage="No updates" />
            </Container>
          )}
          {updates.length >= 10 && updates.length % 10 === 0 && (
            <Container margin="1rem" textAlign="center">
              <Button bsStyle="default" onClick={this.fetchMore}>
                {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
                {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
              </Button>
            </Container>
          )}
        </Container>
      </div>
    );
  }
}

export default Updates;
