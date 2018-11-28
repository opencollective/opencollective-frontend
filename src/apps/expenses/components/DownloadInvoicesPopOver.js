import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { uniq, omit } from 'lodash';

import withIntl from '../../../lib/withIntl';
import { formatCurrency, imagePreview } from '../../../lib/utils';
import { defaultImage } from '../../../constants/collectives';
import InputField from '../../../components/InputField';
import InvoiceDownloadLink from './InvoiceDownloadLink';

import { FileDownload } from 'styled-icons/material/FileDownload.cjs';

class Overlay extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.renderMonth = this.renderMonth.bind(this);
    this.renderInvoice = this.renderInvoice.bind(this);
    this.state = { year: new Date().getFullYear() };
  }

  arrayToFormOptions(arr) {
    return arr.map(key => {
      const obj = {};
      obj[key] = key;
      return obj;
    });
  }

  renderInvoiceLabel(invoice, isLoading) {
    const { totalAmount, currency, host } = invoice;
    const formattedAmount = formatCurrency(totalAmount, currency, { precision: 0 });
    const image = isLoading
      ? '/static/images/loading.gif'
      : imagePreview(host.image, defaultImage.ORGANIZATION, { height: 48 });
    return (
      <React.Fragment>
        <img height={24} src={image} /> {host.slug} ({formattedAmount})
      </React.Fragment>
    );
  }

  renderInvoice(invoice) {
    return (
      <div className="invoice" key={invoice.slug}>
        <style jsx>
          {`
            .invoice {
              margin: 5px 0;
            }
            img {
              margin-right: 5px;
            }
          `}
        </style>
        <InvoiceDownloadLink
          type="invoice"
          fromCollectiveSlug={this.props.fromCollectiveSlug}
          invoice={invoice}
          viewLoading={() => this.renderInvoiceLabel(invoice, true)}
        >
          {this.renderInvoiceLabel(invoice, false)}
        </InvoiceDownloadLink>
      </div>
    );
  }

  renderMonth(month) {
    const invoices = this.props.data.allInvoices.filter(
      i => Number(i.year) === Number(this.state.year) && Number(i.month) === Number(month),
    );
    const month2digit = month < 10 ? `0${month}` : month;
    return (
      <div key={`${this.state.year}-${month}`}>
        <style jsx>
          {`
            h2 {
              font-size: 1.8rem;
            }
          `}
        </style>
        <h2>{moment(new Date(`${this.state.year}-${month2digit}-01`)).format('MMMM')}</h2>
        {invoices.map(this.renderInvoice)}
      </div>
    );
  }

  render() {
    const { data } = this.props;
    const forwardedProps = omit(this.props, ['fromCollectiveSlug', 'data']);

    if (data.loading) {
      return (
        <Popover id="downloadInvoicesPopover" title="Download invoices" {...forwardedProps}>
          <div>
            <FormattedMessage id="loading" defaultMessage="loading" />
            ...
          </div>
        </Popover>
      );
    }
    const invoices = data.allInvoices;
    const years = uniq(invoices.map(i => i.year));
    const months = uniq(invoices.filter(i => Number(i.year) === Number(this.state.year)).map(i => i.month));

    return (
      <Popover id="downloadInvoicesPopover" title="Download invoices" {...forwardedProps}>
        {years.length > 1 && (
          <InputField
            type="select"
            options={this.arrayToFormOptions(years)}
            onChange={year => this.setState({ year })}
          />
        )}

        <div>{months.map(this.renderMonth)}</div>
      </Popover>
    );
  }
}

const getInvoicesQuery = gql`
  query allInvoices($fromCollectiveSlug: String!) {
    allInvoices(fromCollectiveSlug: $fromCollectiveSlug) {
      slug
      year
      month
      totalAmount
      currency
      host {
        id
        slug
        name
        image
      }
    }
  }
`;

const addData = graphql(getInvoicesQuery);

class PopoverButton extends React.Component {
  render() {
    const overlay = <Overlay {...this.props} />;
    return (
      <OverlayTrigger trigger="click" placement="bottom" overlay={overlay} rootClose>
        <a className="download-invoices" role="button" style={{ float: 'right', fontSize: '12px', padding: 7 }}>
          <FileDownload size="1.3em" />{' '}
          <FormattedMessage id="transactions.downloadinvoicesbutton" defaultMessage="Download Receipts" />
        </a>
      </OverlayTrigger>
    );
  }
}

export default withIntl(addData(PopoverButton));
