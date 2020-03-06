import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const logo = '/static/images/opencollective-icon.svg';

class NotificationBar extends React.Component {
  static propTypes = {
    status: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    error: PropTypes.string,
    actions: PropTypes.arrayOf(PropTypes.node),
  };

  render() {
    const { status, error, title, description, actions } = this.props;

    return (
      <div className={classNames(status, 'NotificationBar')}>
        <style jsx>
          {`
            .oc-message {
              position: fixed;
              top: -70px;
              transition: top 1s cubic-bezier(0.45, 0, 1, 1);
              left: 0;
              height: 60px;
              background: white;
              box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.5);
              width: 100%;
              z-index: 1000;
            }
            .oc-message .logo {
              margin: 10px;
            }
            .error .oc-message {
              position: fixed;
              top: 0;
            }

            .loading .oc-progress-bar {
              position: fixed;
              bottom: 0;
              top: auto;
            }
            .oc-progress-bar {
              position: relative;
              width: 100%;
            }
            .oc-bar {
              display: none;
              background-size: 23em 0.25em;
              height: 4px;
              width: 100%;
              position: relative;
              background-color: #3385ff;
            }
            .loading .oc-bar {
              display: block;
              animation: oc-cssload-width 3.45s cubic-bezier(0.45, 0, 1, 1) infinite;
            }
            .error .oc-message {
              display: flex;
              align-items: center;
            }
            .error .oc-message p {
              margin: 0;
            }
            @keyframes oc-cssload-width {
              0%,
              100% {
                transition-timing-function: cubic-bezier(1, 0, 0.65, 0.85);
              }
              0% {
                width: 0;
              }
              100% {
                width: 100%;
              }
            }
            .NotificationLine {
              background: #1769f4;
              padding: 1rem;
              color: white;
              display: flex;
              align-items: center;
              flex-direction: column;
            }
            .collectivePending {
              background: #ff8c00;
            }
            .NotificationLine h1 {
              font-size: 1.8rem;
              margin: 1rem;
            }
            .NotificationLine p.description {
              max-width: 60rem;
              text-align: center;
            }
            .actions {
              display: flex;
            }
            .actions > div {
              margin: 0.5rem;
            }
            .collectiveArchived {
              background: #414141;
            }
          `}
        </style>
        <div className="oc-message">
          <img src={logo} width="40" height="40" className="logo" alt="Open Collective logo" />
          {error && <p>{error}</p>}
        </div>
        {title && (
          <div className={`NotificationLine ${status}`}>
            <h1>{title}</h1>
            <p className="description">{description}</p>
            {actions && (
              <div className="actions">
                {actions.map(action => (
                  <div key={action.key}>{action}</div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="oc-progress-bar">
          <div className="oc-bar" />
        </div>
      </div>
    );
  }
}

export default NotificationBar;
