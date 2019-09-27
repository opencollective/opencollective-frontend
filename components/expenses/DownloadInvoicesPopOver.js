import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import moment from 'moment';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { uniq, omit, groupBy } from 'lodash';
import { FileDownload } from 'styled-icons/material/FileDownload';

import { formatCurrency, getCollectiveImage } from '../../lib/utils';

import InputField from '../InputField';
import InvoiceDownloadLink from './InvoiceDownloadLink';

class Overlay extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.renderMonth = this.renderMonth.bind(this);
    this.renderYear = this.renderYear.bind(this);
    this.renderInvoice = this.renderInvoice.bind(this);
    this.state = {
      year: new Date().getFullYear(),
      isDisplayYearly: false,
    };
  }

  arrayToFormOptions(arr) {
    return arr.map(key => {
      const obj = {};
      obj[key] = key;
      return obj;
    });
  }

  renderInvoiceLabel(isLoading, totalAmount, currency, host) {
    const formattedAmount = formatCurrency(totalAmount, currency, { precision: 0 });
    const image = isLoading ? '/static/images/loading.gif' : getCollectiveImage(host);
    return (
      <React.Fragment>
        <img height={24} src={image} /> {host.slug} ({formattedAmount})
      </React.Fragment>
    );
  }

  renderInvoice(invoice, dateFrom, dateTo, totalAmount) {
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
          fromCollectiveSlug={invoice.fromCollective.slug}
          toCollectiveSlug={invoice.host.slug}
          dateFrom={dateFrom}
          dateTo={dateTo}
          invoice={invoice}
        >
          {({ loading, download }) => (
            <a onClick={download}>{this.renderInvoiceLabel(loading, totalAmount, invoice.currency, invoice.host)}</a>
          )}
        </InvoiceDownloadLink>
      </div>
    );
  }
  renderYear(year) {
    const invoices = this.props.data.allInvoices.filter(i => Number(i.year) === Number(year));
    const invoicesByHost = groupBy(invoices, 'host.slug');
    const dateYear = moment.utc(year, 'YYYY');
    const dateFrom = dateYear.toISOString();
    const dateTo = dateYear.endOf('year').toISOString();

    return (
      invoices.length > 0 && (
        <div key={`${this.state.year}-${year}`}>
          <style jsx>
            {`
              h2 {
                font-size: 1.8rem;
              }
            `}
          </style>
          <h2>{year}</h2>
          {Object.keys(invoicesByHost).map(hostSlug => {
            const hostInvoices = invoicesByHost[hostSlug];
            const totalAmount = hostInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
            return this.renderInvoice(hostInvoices[0], dateFrom, dateTo, totalAmount);
          })}
        </div>
      )
    );
  }

  renderMonth(month) {
    const invoices = this.props.data.allInvoices.filter(
      i => Number(i.year) === Number(this.state.year) && Number(i.month) === Number(month),
    );
    const dateMonth = moment.utc(`${this.state.year}${month}`, 'YYYYMM');
    const dateFrom = dateMonth.toISOString();
    const dateTo = dateMonth.endOf('month').toISOString();
    const month2digit = month < 10 ? `0${month}` : month;

    return (
      invoices.length > 0 && (
        <div key={`${this.state.year}-${month}`}>
          <style jsx>
            {`
              h2 {
                font-size: 1.8rem;
              }
            `}
          </style>
          <h2>{moment.utc(new Date(`${this.state.year}-${month2digit}-01`)).format('MMMM')}</h2>
          {invoices.map(invoice => this.renderInvoice(invoice, dateFrom, dateTo, invoice.totalAmount))}
        </div>
      )
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
        <ul className="nav nav-tabs">
          <li
            role="presentation"
            onClick={() => this.setState({ isDisplayYearly: false })}
            className={classnames({ active: !this.state.isDisplayYearly })}
          >
            <a>Monthly</a>
          </li>
          <li
            role="presentation"
            onClick={() => this.setState({ isDisplayYearly: true })}
            className={classnames({ active: this.state.isDisplayYearly })}
          >
            <a>Yearly</a>
          </li>
        </ul>
        {!this.state.isDisplayYearly && years.length > 1 && (
          <InputField
            name="year-select"
            type="select"
            options={this.arrayToFormOptions(years)}
            onChange={year => this.setState({ year })}
            defaultValue={this.state.year}
          />
        )}
        <div>{this.state.isDisplayYearly ? years.map(this.renderYear) : months.map(this.renderMonth)}</div>
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
      fromCollective {
        slug
      }
      host {
        slug
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

export default addData(PopoverButton);
