import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';
import { FormattedMessage } from 'react-intl';

import { get as fetch } from '../../lib/api';
import { toIsoDateStr } from '../../lib/date-utils';
import { collectiveInvoiceURL, invoiceServiceURL, transactionInvoiceURL } from '../../lib/url_helpers';
import { Span } from '../Text';

export default class InvoiceDownloadLink extends Component {
  static propTypes = {
    /** Link content */
    children: PropTypes.func.isRequired,
    /** Type of the invoice. Set `transaction` for single-transactions invoices */
    type: PropTypes.oneOf(['transaction', 'invoice']).isRequired,
    /** Transaction UUID, only used if type if set to `transaction` */
    transactionUuid: PropTypes.string,
    /** Collective that is paying money, only used if type is set to `invoice` */
    fromCollectiveSlug: PropTypes.string,
    /** Collective that is receiving money, only used if type is set to `invoice` */
    toCollectiveSlug: PropTypes.string,
    /** Invoice date from */
    dateFrom: PropTypes.string,
    /** Invoice date to */
    dateTo: PropTypes.string,
    /** Invoice date to */
    invoice: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { loading: false, error: false };
  }

  getInvoiceUrl() {
    const { fromCollectiveSlug, toCollectiveSlug, dateFrom, dateTo } = this.props;
    return this.props.type === 'transaction'
      ? transactionInvoiceURL(this.props.transactionUuid)
      : collectiveInvoiceURL(fromCollectiveSlug, toCollectiveSlug, encodeURI(dateFrom), encodeURI(dateTo), 'pdf');
  }

  getFilename() {
    const { fromCollectiveSlug, toCollectiveSlug, dateFrom, dateTo } = this.props;
    if (this.props.type === 'transaction') {
      return `transaction-${this.props.transactionUuid}.pdf`;
    } else {
      const fromString = toIsoDateStr(dateFrom ? new Date(dateFrom) : new Date());
      const toString = toIsoDateStr(dateTo ? new Date(dateTo) : new Date());
      return `${fromCollectiveSlug}_${toCollectiveSlug}_${fromString}_${toString}.pdf`;
    }
  }

  download = async () => {
    if (this.state.loading) {
      return false;
    }

    this.setState({ loading: true });
    const invoiceUrl = this.getInvoiceUrl();
    const getParams = { format: 'blob', allowExternal: invoiceServiceURL };
    try {
      const file = await fetch(invoiceUrl, getParams);
      this.setState({ loading: false });
      return saveAs(file, this.getFilename());
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  };

  render() {
    const { loading, error } = this.state;
    return error ? (
      <Span color="red.700">
        <FormattedMessage id="errorMsg" defaultMessage="Error: {error}" values={{ error }} />
      </Span>
    ) : (
      this.props.children({ loading, download: this.download })
    );
  }
}
