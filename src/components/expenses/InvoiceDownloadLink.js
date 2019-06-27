import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { saveAs } from 'file-saver';
import { FormattedMessage } from 'react-intl';

import * as api from '../../lib/api';
import { collectiveInvoiceURL, invoiceServiceURL, transactionInvoiceURL } from '../../lib/url_helpers';

import { Span } from '../Text';

export default class InvoiceDownloadLink extends Component {
  static propTypes = {
    /** Link content */
    children: PropTypes.node.isRequired,
    /** A function that renders children when invoice is loading */
    viewLoading: PropTypes.func.isRequired,
    /** Type of the invoice. Set `transaction` for single-transactions invoices */
    type: PropTypes.oneOf(['transaction', 'invoice']).isRequired,
    /** Transaction UUID, only used if type if set to `transaction` */
    transactionUuid: PropTypes.string,
    /** Collective that is paying money, only used if type is set to `invoice` */
    fromCollectiveSlug: PropTypes.string,
    /** Collective that is receiving money, only used if type is set to `invoice` */
    toCollectiveSlug: PropTypes.string,
    /** Invoice data, only used if type is set to `invoice` */
    dateFrom: PropTypes.string,
    /** Invoice date from */

    dateTo: PropTypes.string,
    /** Invoice  date to  */
    invoice: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { isLoading: false, error: false };
  }

  getInvoiceUrl() {
    const { fromCollectiveSlug, toCollectiveSlug, dateFrom, dateTo } = this.props;
    return this.props.type === 'transaction'
      ? transactionInvoiceURL(this.props.transactionUuid)
      : collectiveInvoiceURL(fromCollectiveSlug, toCollectiveSlug, encodeURI(dateFrom), encodeURI(dateTo), 'pdf');
  }

  getFilename() {
    const { fromCollectiveSlug, toCollectiveSlug, dateFrom, dateTo } = this.props;
    const fromString = moment.utc(dateFrom).format('YYYYMMDD');
    const toString = moment.utc(dateTo).format('YYYYMMDD');

    return this.props.type === 'transaction'
      ? `transaction-${this.props.transactionUuid}.pdf`
      : `${fromCollectiveSlug}_${toCollectiveSlug}_${fromString}-${toString}.pdf`;
  }

  async download() {
    const invoiceUrl = this.getInvoiceUrl();
    const getParams = { format: 'blob', allowExternal: invoiceServiceURL };

    this.setState({ isLoading: true });
    try {
      const file = await api.get(invoiceUrl, getParams);
      this.setState({ isLoading: false });
      return saveAs(file, this.getFilename());
    } catch (e) {
      this.setState({ error: e.message, isLoading: false });
    }
  }

  render() {
    const { isLoading, error } = this.state;
    return error ? (
      <Span color="red.700">
        <FormattedMessage id="errorMsg" defaultMessage="Error: {error}" values={{ error }} />
      </Span>
    ) : (
      <a onClick={() => !isLoading && this.download()}>
        {!isLoading && this.props.children}
        {isLoading && this.props.viewLoading()}
      </a>
    );
  }
}
