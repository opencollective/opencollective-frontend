import React from 'react'
import withIntl from '../lib/withIntl';
import { capitalize, formatCurrency, imagePreview } from '../lib/utils';
import colors from '../constants/colors';
import { FormattedDate } from 'react-intl';
import moment from 'moment';
import { defaultBackgroundImage } from '../constants/collectives';
import { get } from 'lodash';
import Table from 'rc-table';

const baseUrl = 'https://opencollective.com';

class InvoicePage extends React.Component {

  static getInitialProps ({ query: { pageFormat, invoice } }) {
    return { invoice, pageFormat }
  }

  constructor(props) {
    super(props);
    const { pageFormat, invoice } = props;
    this.renderPage = this.renderPage.bind(this);
    this.renderTransaction = this.renderTransaction.bind(this);
    this.dimensions = {
      'A4': {
        unit: 'mm',
        page: {
          width: 210,
          height: 297,
          footerTop: 245
        }
      },
     'Letter': {
        unit: 'in',
        page: {
          width: 8.5,
          height: 11,
          footerTop: 9
        }
      }
    };

    this.dimensions = this.dimensions[pageFormat];
    this.page = this.dimensions.page;

    this.transactionsPerPage = 20;

    this.columns = [
      {title: 'date', dataIndex: 'date', className: 'date' },
      {title: 'collective', dataIndex: 'collective', className: 'collective' },
      {title: 'description', dataIndex: 'description', key: 'description', width: 400, className: 'description'},
      {title: 'amount', dataIndex: 'amount', key: 'amount', className: 'amount'},
    ];

    const localeDateFormat = (pageFormat === 'A4') ? 'fr' : 'en';
    moment.locale(localeDateFormat);

    this.data = [];
    invoice.transactions.forEach(transaction => {
      const createdAt = new Date(transaction.createdAt);
      this.data.push({
        date: moment(createdAt).format('l'),
        description: transaction.description,
        collective: <a href={`https://opencollective.com/${transaction.collective.slug}`}>{transaction.collective.name}</a>,
        amount: formatCurrency(transaction.amount, transaction.currency)
      });
    });

    this.data.push({
      description: "Total",
      amount: formatCurrency(invoice.totalAmount, invoice.currency)
    });

    this.hostBillingAddress = { __html : `${invoice.host.location.name || ''}\n${invoice.host.location.address || ''}`.replace(/\n/g,'<br />') };
    this.fromCollectiveBillingAddress = { __html : `${invoice.fromCollective.location.name || ''}\n${invoice.fromCollective.location.address || ''}`.replace(/\n/g,'<br />') };

  }

  renderPage(pageNumber, transactions) {
    const { invoice } = this.props;

    const coverStyle = { ...get(invoice.host, 'settings.style.hero.cover')};
    const backgroundImage = imagePreview(invoice.host.backgroundImage, invoice.host.type === 'COLLECTIVE' && defaultBackgroundImage[invoice.host.type], { width: 400, baseUrl });
    if (!coverStyle.backgroundImage && backgroundImage) {
      coverStyle.backgroundImage = `url('${backgroundImage}')`;
      coverStyle.backgroundSize = 'cover';
      coverStyle.backgroundPosition = 'center center';
    }

    return (
      <div className="page" key={this.pageNumber}>
        <style jsx>{`
          .page {
            position: relative;
          }

          .footer {
            position: absolute;
            top: ${this.page.footerTop}${this.dimensions.unit};
            width: ${this.page.width}${this.dimensions.unit};
            margin: 0 -2rem;
            text-align: center;
            font-size: 10px;
          }
          
          .footer img {
            max-height: 100px;
            max-width: 200px;
          }
        `}</style>
        <div className="InvoicePage">
        <div className="header">
          <a href={`https://opencollective.com/${invoice.host.slug}`}>
            <div className="hero">
              <div className="cover" style={coverStyle} />
              <div className="logo" style={{backgroundImage:`url('${imagePreview(invoice.host.image, null, { height: 200, baseUrl })}')`}} />
            </div>
          </a>

          <div className="collectiveInfo">
            <h1>{invoice.host.name}</h1>
            <a href={`https://opencollective.com/${invoice.host.slug}`} className="website">https://opencollective.com/{invoice.host.slug}</a>
          </div>
        </div>

        <div className="body">
          <div className="row">
            <div className="invoiceDetails">
              <h2>{ invoice.title || "Donation Receipt"}</h2>
              <div className="detail"><label>Date:</label>{invoice.year}/{invoice.month}</div>
              <div className="detail reference"><label>Reference:</label> {invoice.slug}</div>
            </div>
            <div className="fromCollectiveBillingAddress">
              <h2>Bill to:</h2>
              {invoice.fromCollective.name}<br />
              <div dangerouslySetInnerHTML={this.fromCollectiveBillingAddress} />
            </div>
          </div>

          <Table columns={this.columns} data={this.data} rowClassName={(row, index) => (index === this.data.length - 1) ? `footer` : ''} />
        </div>

        <div className="footer">
          <a href={invoice.host.website}>
              <img src={imagePreview(invoice.host.image, null, { height: 200, baseUrl })} />
          </a><br />
          <div className="hostBillingAddress">
            {invoice.host.name}<br />
            <div dangerouslySetInnerHTML={this.hostBillingAddress} />
          </div>
        </div>
        </div>
      </div>
    )
  }

  renderTransaction(transaction, index) {
    if (!transaction || !transaction.createdAt) {
      console.error(">>> renderTransaction error: invalid transaction object", transaction);
      return;
    }
    return (
      <div className="transaction" key={index}>
        <div className="createdAt"><FormattedDate value={new Date(transaction.createdAt)} day='numeric' month='long' year='numeric' /></div>
        <div className="description">{transaction.description}</div>
        <div className="amount">{ formatCurrency(transaction.amount, transaction.currency) }</div>
      </div>
    )
  }

  render() {
    const { invoice } = this.props;
    if (!invoice) {
      return (<div>No invoice to render</div>);
    }
    const { transactions } = invoice;
    if (!transactions || transactions.length === 0) {
      return (<div>No transaction to render</div>);
    }
    return (
      <div className={`InvoicePages ${invoice.fromCollective.slug}`}>
        <style jsx global>{`
          @font-face {
            font-family: 'montserratlight';
            src: url('/static/fonts/montserrat/montserrat-light-webfont.eot');
            src: url('/static/fonts/montserrat/montserrat-light-webfont.eot?#iefix') format('embedded-opentype'),
              url('/static/fonts/montserrat/montserrat-light-webfont.woff2') format('woff2'),
              url('/static/fonts/montserrat/montserrat-light-webfont.woff') format('woff'),
              url('/static/fonts/montserrat/montserrat-light-webfont.ttf') format('truetype'),
              url('/static/fonts/montserrat/montserrat-light-webfont.svg#montserratlight') format('svg');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'lato';
            src: url('/static/fonts/montserrat/lato-regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }

          html {
            font-size: 62.5%;
            width:${this.page.width}${this.dimensions.unit};
            zoom: .75;
          }

          body {
            width:${this.page.width}${this.dimensions.unit};
            padding: 0;
            margin: 0;
            font-family: Lato,Helvetica,sans-serif;
            font-weight: 300;
            font-size: 1.6rem;
            line-height: 1.5;
          }

          .page {
            width: ${this.page.width}${this.dimensions.unit};
            height: ${this.page.height}${this.dimensions.unit};
            overflow: hidden;
            box-sizing: border-box;
          }

          .InvoicePage {
            margin: 0 auto;
            padding: 2rem;
            width: 100%;
          }

          .Invoice {
            padding: 3rem;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            -webkit-flex: 1;
            -webkit-flex-direction: column;
            -webkit-justify-content: space-between;
            box-sizing: border-box;
          }
          .header {
            margin: 10px 0px;
            overflow: hidden;
          }

          a {
            text-decoration: none;
          }

          h1 {
            margin: 10px 0px 5px;
            line-height: 20px;
            font-size: 2rem;
          }
        
          h2 {
            margin-bottom: 0;
            font-size: 1.6rem;
          }

          .row {
            overflow: hidden;
          }
          
          .hero {
            border-radius: 3px;
            float: left;
            overflow: hidden;
            width: 120px;
            height: 60px;
            position: relative;
            margin: 0px 20px 20px 0px;
          }

          .cover {
            position: absolute;
            background-size: cover;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
          }

          .logo {
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            max-width: 75%;
            max-height: 75%;
            margin: auto;
          }

          .invoiceDetails {
            float: left;
          }
        
          .fromCollectiveBillingAddress {
            float: right;
            padding-right: 15rem;
          }
        
          label {
            display: inline-block;
            width: 8rem;
          }
        
          .rc-table {
            clear: both;
            margin: 100px 0px;
          }
        
          table {
            margin: 8rem 0rem;
            overflow: hidden;
            width: 95%;
          }
        
          td {
            padding: 5px;
            vertical-align: top;
          }
      
          .date {
            width: 2rem;
          }
      
          .amount {
            width: 3rem;
            text-align: right;
            padding-right: 2rem;
          }
      
          tr.footer {
            border-top: 1px solid grey;
            font-weight: bold;
            text-align: left;
            font-size: 12px;
          }

          tr.footer td {
            font-size: 1.6rem;
          }

          tr.footer img {
            max-height: 100px;
          }

          tr.footer .description {
            text-align: right;
          }
        `}</style>

        <div className="pages">
          {transactions.map((transaction, index) => {
            if (index % this.transactionsPerPage === 0) {
              return this.renderPage(index/this.transactionsPerPage + 1, transactions.slice(index, index + this.transactionsPerPage));
            }
          })}
        </div>
      </div>
    );
  }
}

export default withIntl(InvoicePage);