import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import {
  Popover,
  OverlayTrigger,
} from 'react-bootstrap';

import withIntl from '../lib/withIntl';
import InputField from './InputField';
import { uniq } from 'lodash';
import * as api from '../lib/api';
import { saveAs } from 'file-saver'
import { formatCurrency, imagePreview } from '../lib/utils';
import { defaultImage } from '../constants/collectives';

class Overlay extends React.Component {

  static propTypes = {
    data: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.download = this.download.bind(this);
    this.renderMonth = this.renderMonth.bind(this);
    this.renderInvoice = this.renderInvoice.bind(this);
    this.state = {
      loading: false,
      year: (new Date).getFullYear()
    };
  }

  async download(invoice) {
    this.setState({ loading: invoice.slug })
    const { fromCollectiveSlug } = this.props;
    const file = await api.get(`/${fromCollectiveSlug}/invoices/${invoice.slug}.pdf`, { format: 'blob'});
    this.setState({ loading: false });
    return saveAs(file, `${invoice.slug}.pdf`);
  }

  arrayToFormOptions(arr) {
    return arr.map(key => {
      const obj = {};
      obj[key] = key;
      return obj;
    })
  }

  renderInvoice(invoice) {
    const icon = (this.state.loading === invoice.slug)
      ? '/public/images/loading.gif'
      : imagePreview(invoice.host.image, defaultImage.ORGANIZATION, { height: 48 });

    return (
      <div className="invoice" key={invoice.slug}>
        <style jsx>{`
          .invoice {
            margin: 5px 0;
          }
          img {
            margin-right: 5px;
          }
        `}</style>
        <a onClick={() => this.download(invoice)}>
          <img height={24} src={icon} />
          {invoice.host.slug} ({formatCurrency(invoice.totalAmount, invoice.currency, { precision: 0 })})
        </a>
      </div>
    )
  }

  renderMonth(month) {
    const invoices = this.props.data.allInvoices.filter(i => Number(i.year) === Number(this.state.year) && Number(i.month) === Number(month));
    const month2digit = month < 10 ? `0${month}` : month;
    return (
      <div>
        <style jsx>{`
          h2 {
            font-size: 1.8rem;
          }
        `}</style>
        <h2>{moment(new Date(`${this.state.year}-${month2digit}-01`)).format('MMMM')}</h2>
        {invoices.map(this.renderInvoice)}
      </div>
    )
  }

  render() {
    const { data } = this.props;
    if (data.loading) {
      return (
        <Popover id="downloadInvoicesPopover" title="Download invoices" {...this.props}>
          <div><FormattedMessage id="loading" defaultMessage="loading" />...</div>
        </Popover>
      )
    }
    const invoices = data.allInvoices;
    const years = uniq(invoices.map(i => i.year));
    const months = uniq(invoices.filter(i => Number(i.year) === Number(this.state.year)).map(i => i.month));

    return (
      <Popover id="downloadInvoicesPopover" title="Download invoices" {...this.props}>
        <InputField
          type="select"
          options={this.arrayToFormOptions(years)}
          onChange={(year => this.setState({ year }))}
          />
        <div>
          { months.map(this.renderMonth)}
        </div>
      </Popover>
    )
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
    const overlay = <Overlay data={this.props.data} />;
    return (
      <OverlayTrigger trigger="click" placement="bottom" overlay={overlay} rootClose>
        <a className="download-invoices" role="button" style={{ float: 'right', fontSize: '12px', padding: 7 }}>
          <img src="/static/images/icons/download.svg" style={{ paddingRight: 5 }} />
          <FormattedMessage id='transactions.downloadinvoicesbutton' defaultMessage='Download Receipts' />
        </a>
      </OverlayTrigger>
    )
  }
}

export default withIntl(addData(PopoverButton));
