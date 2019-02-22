import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as api from '../../../lib/api';
import { saveAs } from 'file-saver';

import { collectiveInvoiceURL, invoiceServiceURL, transactionInvoiceURL } from '../../../lib/url_helpers';

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
    /** Collective for which invoice is generated, only used if type is set to `invoice` */
    fromCollectiveSlug: PropTypes.string,
    /** Invoice data, only used if type is set to `invoice` */
    invoice: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { isLoading: false };
  }

  getInvoiceUrl() {
    return this.props.type === 'transaction'
      ? transactionInvoiceURL(this.props.transactionUuid)
      : collectiveInvoiceURL(this.props.fromCollectiveSlug, this.props.invoice.slug, 'pdf');
  }

  getFilename() {
    return this.props.type === 'transaction'
      ? `transaction-${this.props.transactionUuid}.pdf`
      : `${this.props.invoice.slug}.pdf`;
  }

  async download() {
    const invoiceUrl = this.getInvoiceUrl();
    const getParams = { format: 'blob', allowExternal: invoiceServiceURL };

    this.setState({ isLoading: true });
    const file = await api.get(invoiceUrl, getParams);
    this.setState({ isLoading: false });

    return saveAs(file, this.getFilename());
  }

  render() {
    const { isLoading } = this.state;
    return (
      <a onClick={() => !isLoading && this.download()}>
        {!isLoading && this.props.children}
        {isLoading && this.props.viewLoading()}
      </a>
    );
  }
}
