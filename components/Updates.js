import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import colors from '../lib/constants/colors';

import StyledUpdate from './StyledUpdate';

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
        <style jsx>
          {`
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .empty {
              color: ${colors.darkgray};
            }
            .itemsList {
              position: relative;
            }
            .loading {
              color: ${colors.darkgray};
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
            }
            .update {
              padding: 0;
            }
          `}
        </style>

        <div className="itemsList">
          {this.state.loading && (
            <div className="loading">
              <FormattedMessage id="loading" defaultMessage="loading" />
            </div>
          )}
          {updates.map((update, index) => (
            <div key={update.id} className="update">
              <StyledUpdate
                update={update}
                collective={collective}
                compact={true}
                borderTop={index === 0 ? undefined : 'none'}
              />
            </div>
          ))}
          {updates.length === 0 && (
            <div className="empty">
              <FormattedMessage id="updates.empty" defaultMessage="No updates" />
            </div>
          )}
          {updates.length >= 10 && updates.length % 10 === 0 && (
            <div className="loadMoreBtn">
              <Button bsStyle="default" onClick={this.fetchMore}>
                {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
                {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Updates;
