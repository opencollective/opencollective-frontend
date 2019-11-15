import React from 'react';
import PropTypes from 'prop-types';
import Comment from './Comment';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import colors from '../lib/constants/colors';

class Comments extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    comments: PropTypes.array,
    fetchMore: PropTypes.func,
    editable: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    refetch: PropTypes.func,
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
    const { collective, comments, LoggedInUser, editable } = this.props;

    if (!comments) {
      return <div />;
    }

    return (
      <div className="Comments">
        <style jsx>
          {`
            .Comments {
              min-width: 30rem;
              max-width: 80rem;
            }
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .empty {
              text-align: center;
              margin: 4rem;
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
          `}
        </style>

        <div className="itemsList">
          {this.state.loading && (
            <div className="loading">
              <FormattedMessage id="loading" defaultMessage="loading" />
            </div>
          )}
          {comments.map(comment => (
            <Comment
              key={comment.id}
              collective={collective}
              comment={comment}
              editable={editable}
              LoggedInUser={LoggedInUser}
              refetch={this.props.refetch}
            />
          ))}
          {comments.length >= 10 && comments.length % 10 === 0 && (
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

export default Comments;
