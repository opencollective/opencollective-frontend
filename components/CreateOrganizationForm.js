import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-bootstrap';
import SectionTitle from './SectionTitle';
import InputField from './InputField';
import { defineMessages, injectIntl } from 'react-intl';

class CreateOrganizationForm extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    header: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { form: {} };

    this.messages = defineMessages({
      'order.organization.name': {
        id: 'Fields.name',
        defaultMessage: 'Name',
      },
      'order.organization.website': {
        id: 'Fields.website',
        defaultMessage: 'Website',
      },
      'order.organization.twitterHandle.description': {
        id: 'tier.order.organization.twitterHandle.description',
        defaultMessage: 'optional',
      },
    });
  }

  handleChange(attr, value) {
    const { form } = this.state;
    form[attr] = value;
    this.setState({ form });
    this.props.onChange(form);
  }

  render() {
    const { intl, header } = this.props;

    return (
      <section className="organizationDetailsForm">
        {header !== false && <SectionTitle section="organizationDetails" />}
        <Row key="organization.name.input">
          <Col sm={12}>
            <InputField
              className="horizontal"
              type="text"
              name="organization_name"
              label={intl.formatMessage(this.messages['order.organization.name'])}
              onChange={value => this.handleChange('name', value)}
            />
          </Col>
        </Row>
        <Row key="organization.website.input">
          <Col sm={12}>
            <InputField
              className="horizontal"
              type="text"
              name="organization_website"
              label={intl.formatMessage(this.messages['order.organization.website'])}
              onChange={value => this.handleChange('website', value)}
            />
          </Col>
        </Row>
        <Row key="organization.twitterHandle.input">
          <Col sm={12}>
            <InputField
              className="horizontal"
              type="text"
              name="organization_twitterHandle"
              pre="@"
              label="Twitter"
              help={intl.formatMessage(this.messages['order.organization.twitterHandle.description'])}
              onChange={value => this.handleChange('twitterHandle', value)}
            />
          </Col>
        </Row>
      </section>
    );
  }
}

export default injectIntl(CreateOrganizationForm);
