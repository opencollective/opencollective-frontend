import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import SmallButton from '../SmallButton';

class MarkOrderAsPaidBtn extends React.Component {
  static propTypes = {
    order: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
    markOrderAsPaid: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      paymentProcessorFeeInHostCurrency: 0,
    };
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { order } = this.props;
    if (this.props.disabled) {
      return;
    }
    this.setState({ loading: true });
    try {
      await this.props.markOrderAsPaid(order.id, this.state.paymentProcessorFeeInHostCurrency);
      this.setState({ loading: false });
    } catch (e) {
      const error = e.message && e.message.replace(/GraphQL error:/, '');
      this.setState({ error, loading: false });
    }
  }

  render() {
    const disabled = this.state.loading,
      title = '',
      error = this.state.error;

    return (
      <div className="MarkOrderAsPaidBtn">
        <style jsx>
          {`
            .MarkOrderAsPaidBtn {
              align-items: flex-end;
              display: flex;
              flex-wrap: wrap;
            }
            .error {
              display: flex;
              align-items: center;
              color: red;
              font-size: 1.3rem;
              padding-left: 1rem;
            }

            .processorFee {
              margin-right: 1rem;
              max-width: 16rem;
            }

            .processorFee label {
              margin: 0;
            }
          `}
        </style>
        <style global jsx>
          {`
            .processorFee .inputField,
            .processorFee .form-group {
              margin: 0;
            }

            .processorFee .inputField {
              margin-top: 0.5rem;
            }
          `}
        </style>

        <SmallButton
          className="MarkOrderAsPaidSmallBtn pay"
          onClick={this.onClick}
          disabled={this.props.disabled || disabled}
          title={title}
        >
          <FormattedMessage id="order.markAsPaid.btn" defaultMessage="Mark as paid" />
        </SmallButton>
        <div className="error">{error}</div>
      </div>
    );
  }
}

const markOrderAsPaidQuery = gql`
  mutation markOrderAsPaid($id: Int!) {
    markOrderAsPaid(id: $id) {
      id
      status
      collective {
        id
        stats {
          id
          balance
        }
      }
    }
  }
`;

const addMutation = graphql(markOrderAsPaidQuery, {
  props: ({ mutate }) => ({
    markOrderAsPaid: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addMutation(MarkOrderAsPaidBtn);
