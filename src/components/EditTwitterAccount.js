import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import { FormattedMessage, defineMessages } from 'react-intl';
import gql from 'graphql-tag'
import InputField from './InputField';
import SmallButton from './SmallButton';
import { cloneDeep, pick } from 'lodash';
import { Form, Row, Col } from 'react-bootstrap';

class EditTwitterAccount extends React.Component {

  static propTypes = {
    connectedAccount: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.messages = defineMessages({
      'backer.created.toggle.label': { id: 'connectedAccounts.twitter.backer.created.toggle.label', defaultMessage: 'New backers' },
      'backer.created.toggle.description': { id: 'connectedAccounts.twitter.backer.created.toggle.description', defaultMessage: 'Whenever you have a new backer that has provided a twitter username, a tweet will be sent from your connected account' },
      'backer.created.tweet': { id: 'connectedAccounts.twitter.backer.created.tweet', defaultMessage: '{backerTwitterHandle} thank you for your {amount} donation 🙏 - your contribution makes a difference!' }
    });
    this.state = { connectedAccount: cloneDeep(props.connectedAccount) };
    this.state.connectedAccount.settings = this.state.connectedAccount.settings || { 'backer.created': {} };
  }

  async onClick() {
    const connectedAccount = pick(this.state.connectedAccount, ['id', 'settings']);
    await this.props.editConnectedAccount(connectedAccount);
    this.setState({ isModified: false });
  }

  handleChange(notification, attr, val) {
    const { connectedAccount } = this.state;
    connectedAccount.settings[notification][attr] = val;
    this.setState({ connectedAccount, isModified: true });
  }

  render() {
    const { intl } = this.props;
    const { connectedAccount } = this.state;

    return (
      <div className="EditTwitterAccount">
        <Form horizontal>
          <h3><FormattedMessage id="connectedAccounts.twitter.settings" defaultMessage="Settings" /></h3>
          <Row>
            <Col sm={12}>
              <InputField
                  type="toggle"
                  name="backer.created.active"
                  className="horizontal"
                  defaultValue={connectedAccount.settings['backer.created'].active}
                  label={intl.formatMessage(this.messages['backer.created.toggle.label'])}
                  description={intl.formatMessage(this.messages['backer.created.toggle.description'])}
                  onChange={(activateNewBacker) => this.handleChange("backer.created", "active", activateNewBacker)}
                  />
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <InputField
                type="textarea"
                className="horizontal"
                name="backer.created.tweet"
                defaultValue={connectedAccount.settings['backer.created'].tweet || intl.formatMessage(this.messages['backer.created.tweet'])}
                onChange={(tweet) => this.handleChange("backer.created", "tweet", tweet)}
                />
            </Col>
          </Row>
          <Row>
            <Col sm={3}></Col>
            <Col sm={9}>
              { this.state.isModified &&
                <SmallButton className="default" bsStyle="primary" onClick={this.onClick}>
                  <FormattedMessage id="connectedAccount.save.btn" defaultMessage="save" />
                </SmallButton>
              }
            </Col>
          </Row>
        </Form>
      </div>
    );
  }

}

const editConnectedAccountQuery = gql`
mutation editConnectedAccount($connectedAccount: ConnectedAccountInputType!) {
  editConnectedAccount(connectedAccount: $connectedAccount) {
    id
    settings
  }
}
`;

const addMutation = graphql(editConnectedAccountQuery, {
  props: ( { mutate }) => ({
    editConnectedAccount: async (connectedAccount) => {
      return await mutate({ variables: { connectedAccount } })
    }
  })
});

export default addMutation(withIntl(EditTwitterAccount));