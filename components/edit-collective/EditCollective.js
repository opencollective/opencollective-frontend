import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/utils';
import Header from '../Header';
import Body from '../Body';
import Footer from '../Footer';
import SignInOrJoinFree from '../SignInOrJoinFree';
import EditCollectiveForm from './EditCollectiveForm';
import CollectiveNavbar from '../CollectiveNavbar';
import NotificationBar from '../NotificationBar';
import { defaultBackgroundImage } from '../../lib/constants/collectives';
import Loading from '../Loading';

class EditCollective extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    editCollective: PropTypes.func.isRequired,
    loggedInEditDataLoaded: PropTypes.bool.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.editCollective = this.editCollective.bind(this);
    this.state = { status: null, result: {} };
    this.messages = defineMessages({
      'collective.isArchived': {
        id: 'collective.isArchived',
        defaultMessage: '{name} has been archived.',
      },
      'collective.isArchived.edit.description': {
        id: 'collective.isArchived.edit.description',
        defaultMessage: 'This {type} has been archived and can no longer be used for any activities.',
      },
      'user.isArchived': {
        id: 'user.isArchived',
        defaultMessage: 'Account has been archived.',
      },
      'user.isArchived.edit.description': {
        id: 'user.isArchived.edit.description',
        defaultMessage: 'This account has been archived and can no longer be used for any activities.',
      },
    });
  }

  componentDidMount() {
    window.OC = window.OC || {};
    window.OC.editCollective = this.editCollective.bind(this);
  }

  validate(CollectiveInputType) {
    if (typeof CollectiveInputType.tags === 'string') {
      CollectiveInputType.tags = CollectiveInputType.tags.split(',').map(t => t.trim());
    }
    if (CollectiveInputType.backgroundImage === defaultBackgroundImage[CollectiveInputType.type]) {
      delete CollectiveInputType.backgroundImage;
    }

    const { collective } = this.props;
    CollectiveInputType.settings = {
      ...collective.settings,
      editor: CollectiveInputType.markdown ? 'markdown' : 'html',
      sendInvoiceByEmail: CollectiveInputType.sendInvoiceByEmail,
      apply: CollectiveInputType.application,
      tos: CollectiveInputType.tos,
    };
    delete CollectiveInputType.markdown;
    delete CollectiveInputType.sendInvoiceByEmail;
    delete CollectiveInputType.tos;
    delete CollectiveInputType.application;

    return CollectiveInputType;
  }

  async editCollective(CollectiveInputType) {
    CollectiveInputType = this.validate(CollectiveInputType);
    if (!CollectiveInputType) {
      return false;
    }

    this.setState({ status: 'loading' });
    try {
      await this.props.editCollective(CollectiveInputType);
      this.setState({ status: 'saved', result: { error: null } });
      setTimeout(() => {
        this.setState({ status: null });
      }, 3000);
    } catch (err) {
      console.error('>>> editCollective error:', JSON.stringify(err));
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ status: null, result: { error: errorMsg } });
    }
  }

  render() {
    const { intl, LoggedInUser, collective, loggedInEditDataLoaded } = this.props;

    if (!collective || !collective.slug) {
      return <div />;
    }

    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const notification = {};
    if (collective.isArchived && collective.type === 'USER') {
      notification.title = intl.formatMessage(this.messages['user.isArchived']);
      notification.description = intl.formatMessage(this.messages['user.isArchived.edit.description']);
      notification.status = 'collectiveArchived';
    } else if (collective.isArchived) {
      notification.title = intl.formatMessage(this.messages['collective.isArchived'], {
        name: collective.name,
      });
      notification.description = intl.formatMessage(this.messages['collective.isArchived.edit.description'], {
        type: collective.type.toLowerCase(),
      });
      notification.status = 'collectiveArchived';
    }

    return (
      <div className="EditCollective">
        <style jsx>
          {`
            .success {
              color: green;
            }
            .error {
              color: red;
            }
            .login {
              text-align: center;
            }
            .actions {
              text-align: center;
              margin-bottom: 5rem;
            }
          `}
        </style>

        <Header collective={collective} className={this.state.status} LoggedInUser={LoggedInUser} />

        <Body>
          {collective.isArchived && (
            <NotificationBar
              status={notification.status || status}
              title={notification.title}
              description={notification.description}
            />
          )}
          <CollectiveNavbar collective={collective} isAdmin={canEditCollective} />
          <div className="content">
            {!canEditCollective && (
              <div className="login">
                <p>
                  You need to be logged in as the creator of this collective
                  <br />
                  or as a core contributor of the {collective.name} collective.
                </p>
                <SignInOrJoinFree />
              </div>
            )}
            {canEditCollective && !loggedInEditDataLoaded && <Loading />}
            {canEditCollective && loggedInEditDataLoaded && (
              <div>
                <EditCollectiveForm
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  onSubmit={this.editCollective}
                  status={this.state.status}
                />
                <div className="actions">
                  <div className="result">
                    <div className="success">{this.state.result.success}</div>
                    <div className="error">{this.state.result.error}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default injectIntl(EditCollective);
