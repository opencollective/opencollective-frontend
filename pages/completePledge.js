import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { Flex } from '@rebass/grid';
import { defineMessages, injectIntl } from 'react-intl';

import Page from '../components/Page';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import ContributionFlow from '../components/contribution-flow';

const messages = defineMessages({
  title: {
    id: 'completePledge.Title',
    defaultMessage: 'Complete your pledge',
  },
  missingOrder: {
    id: 'completePledge.MissingOrder',
    defaultMessage: "This pledge doesn't exist or has already been completed.",
  },
  missingHost: {
    id: 'createOrder.missingHost',
    defaultMessage: "This collective doesn't have a host and can't accept financial contributions",
  },
  inactiveCollective: {
    id: 'createOrder.inactiveCollective',
    defaultMessage: "This collective is not active and can't accept financial contributions",
  },
});

class CompletePledgePage extends React.Component {
  static getInitialProps({ query = {} }) {
    return { orderId: Number(query.orderId), step: query.step };
  }

  static propTypes = {
    intl: PropTypes.object,
    completePledge: PropTypes.func,
    orderId: PropTypes.number.isRequired,
    step: PropTypes.string,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      Order: PropTypes.shape({
        status: PropTypes.string,
        interval: PropTypes.string,
        totalAmount: PropTypes.number,
        collective: PropTypes.shape({
          isActive: PropTypes.bool,
          host: PropTypes.object,
          image: PropTypes.string,
          backgroundImage: PropTypes.string,
          twitterHandle: PropTypes.string,
          description: PropTypes.string,
        }),
      }),
    }),
  };

  state = { isRedirecting: false };

  isLoading() {
    return this.state.isRedirecting || (this.props.data && this.props.data.loading);
  }

  getPageMetadata() {
    const { intl, data } = this.props;
    const title = intl.formatMessage(messages.title);

    if (!data || !data.Order || !data.Order.collective) {
      return { title };
    }

    const collective = data.Order.collective;
    return {
      description: collective.description,
      twitterHandle: collective.twitterHandle,
      image: collective.image || collective.backgroundImage,
      title: title,
    };
  }

  renderMessage(type, message) {
    return (
      <Flex py={[5, 6, 7]} justifyContent="center">
        <MessageBox type={type} withIcon>
          {message}
        </MessageBox>
      </Flex>
    );
  }

  renderPageContent() {
    const { data, intl } = this.props;
    const { Order } = data;

    if (this.isLoading()) {
      return (
        <Flex py={5} justifyContent="center">
          <Loading />
        </Flex>
      );
    } else if (!Order || ['ACTIVE', 'PAID'].includes(Order.status)) {
      return this.renderMessage('warning', intl.formatMessage(messages.missingOrder));
    } else if (!Order.collective || !Order.collective.isActive) {
      return this.renderMessage('warning', intl.formatMessage(messages.inactiveCollective));
    } else if (!Order.collective.host) {
      return this.renderMessage('error', intl.formatMessage(messages.missingHost));
    } else {
      return (
        <ContributionFlow
          collective={Order.collective}
          host={Order.collective.host}
          pledge={Order}
          step={this.props.step || 'contributeAs'}
          onSuccess={() => {
            // Because Apollo will update the order data with the new status, we need to show
            // a loading indicator when the order success to avoid showing a warning saying
            // that the order has already been confirmed.
            this.setState({ isRedirecting: true });
          }}
        />
      );
    }
  }

  render() {
    const { data } = this.props;

    if (!this.isLoading() && (!data || !data.Order)) {
      return <ErrorPage data={data} />;
    } else {
      return <Page {...this.getPageMetadata()}>{this.renderPageContent()}</Page>;
    }
  }
}

const addOrderData = graphql(gql`
  query getOrder($orderId: Int!) {
    Order(id: $orderId) {
      id
      interval
      publicMessage
      quantity
      totalAmount
      status
      collective {
        id
        type
        slug
        currency
        hostFeePercent
        isActive
        name
        description
        twitterHandle
        backgroundImage
        image
        location {
          country
        }
        parentCollective {
          id
          slug
          settings
          location {
            country
          }
        }
        host {
          id
          name
          settings
          location {
            country
          }
        }
        paymentMethods {
          id
          name
          service
        }
      }
    }
  }
`);

export default addOrderData(injectIntl(CompletePledgePage));
