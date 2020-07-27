import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/fa-solid/Check';
import themeGet from '@styled-system/theme-get';
import { isObject } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { display } from 'styled-system';

import Container from '../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../FormattedMoneyAmount';
import { Box } from '../Grid';
import StyledLink from '../StyledLink';

const PlanLink = styled(StyledLink).attrs({
  buttonStyle: 'primary',
})`
  background: linear-gradient(180deg, #1869f5 0%, #1659e1 100%);
  border-radius: 100px;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  padding: 5px 14px;
  color: #fff;
  min-width: 72px;
  ${display};
  margin: auto;
  white-space: nowrap;

  @media screen and (min-width: 64em) {
    min-width: 100px;
  }
`;

const StyledCheck = styled(Check)`
  color: #25b869;
`;

const Wrapper = styled(Box)`
  border-right: 1px solid #dcdee0;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  box-shadow: 4px 0px 8px rgba(20, 20, 20, 0.06);
  overflow-x: auto;
  margin-left: 136px;
  width: 100%;

  @media screen and (min-width: 52em) {
    margin-left: 0;
    border-radius: 8px;
    border-left: 1px solid #dcdee0;
  }
`;

const StyledTable = styled(Box)`
  width: 100%;
  table-layout: fixed;
  box-shadow: 4px 0px 8px rgba(20, 20, 20, 0.06);

  tr:first-child th {
    border-top: 1px solid #dcdee0;
  }

  tfoot tr:last-child td {
    border-bottom: 1px solid #dcdee0;
  }

  /* Rounded conners */
  tfoot tr:last-child td:first-child {
    border-bottom-left-radius: 8px;
  }

  tfoot tr:last-child td:last-child {
    border-bottom-right-radius: 8px;
  }

  @media screen and (max-width: 62em) {
    tfoot tr:last-child td:last-child {
      border-bottom-right-radius: 8px;
      padding-left: 1%;
      padding-right: 1%;
    }
    tfoot tr:last-child td:last-child a {
      width: fit-content;
    }
  }

  thead tr:first-child th:first-child {
    border-top-left-radius: 8px;
  }

  td:nth-child(1),
  th:nth-child(1) {
    background: #f7f8fa;
    width: 136px;
    font-weight: 500;
    font-size: 12px;
    line-height: 19px;
    text-align: right;
    letter-spacing: -0.012em;
    padding: 16px 16px 16px 8px;
    color: ${themeGet('colors.black.800')};
    position: absolute;
    top: auto;
    left: 16px;
    border-left: 1px solid #dcdee0;
    backface-visibility: hidden;

    @media screen and (min-width: 52em) {
      width: 176px;
      left: 50px;
    }

    @media screen and (min-width: 52em) {
      position: relative;
      left: 0;
      border-left: none;
    }
  }
  td:nth-child(n + 2),
  th:nth-child(n + 2) {
    width: 120px;
    padding-right: 24px;
    padding-left: 24px;

    @media screen and (min-width: 64em) {
      width: 150px;
    }
  }

  td:nth-child(n + 2) {
    text-align: center;
    font-weight: 500;
    font-size: 13px;
    line-height: 19px;
    letter-spacing: -0.008em;
    word-wrap: break-word;
  }

  th {
    padding-top: 32px;
    padding-bottom: 10px;
  }

  th:nth-child(n + 2),
  .head {
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.colors.black[700]};
    word-wrap: break-word;
  }

  th,
  td {
    border-right: 1px solid #dcdee0;
  }

  th:last-child,
  td:last-child {
    @media screen and (min-width: 88em) {
      border-right: none;
    }
  }

  .footer {
    padding-top: 16px;
    padding-bottom: 32px;
    text-align: center;
  }
`;

const messages = defineMessages({
  'table.head.starter': {
    id: 'table.head.starter',
    defaultMessage: 'Starter',
  },
  'table.head.singleCollective': {
    id: 'table.head.singleCollective',
    defaultMessage: 'Single Collective',
  },
  'table.head.small': {
    id: 'table.head.small',
    defaultMessage: 'Small',
  },
  'table.head.medium': {
    id: 'table.head.medium',
    defaultMessage: 'Medium',
  },
  'table.head.large': {
    id: 'table.head.large',
    defaultMessage: 'Large',
  },
  'table.head.network': {
    id: 'table.head.network',
    defaultMessage: 'Network',
  },
});

const Cell = ({ content, header, height }) => {
  const style = height ? { height: `${height}px` } : undefined;
  const intl = useIntl();
  if (isObject(content)) {
    switch (content.type) {
      case 'price':
        return (
          <td style={style}>
            <Box as="span" display={['none', null, 'inline']}>
              <FormattedMoneyAmount
                amount={content.amount}
                interval={content.frequency}
                currency="USD"
                amountStyles={{ ...DEFAULT_AMOUNT_STYLES, fontSize: 20 }}
                showCurrencyCode={false}
                precision={0}
              />
            </Box>
            <Box as="span" display={['inline', null, 'none']}>
              <FormattedMoneyAmount
                amount={content.amount}
                interval={content.frequency}
                currency="USD"
                amountStyles={{ ...DEFAULT_AMOUNT_STYLES, fontSize: 20 }}
                showCurrencyCode={false}
                abbreviateInterval
                precision={0}
              />
            </Box>
          </td>
        );
      case 'check':
        return (
          <td style={style}>
            <StyledCheck size="13" />
          </td>
        );
      case 'html':
        return (
          <td>
            <span
              dangerouslySetInnerHTML={{
                __html: content.html,
              }}
            ></span>
          </td>
        );
      case 'button':
        return (
          <td className="footer" style={style}>
            <PlanLink href={content.url} display={['none', null, null, 'block']}>
              {content.cta || <FormattedMessage id="pricingTable.action.choosePlan" defaultMessage="Choose plan" />}
            </PlanLink>
            <PlanLink href={content.url} display={['block', null, null, 'none']}>
              {content.cta || <FormattedMessage id="pricingTable.action.choose" defaultMessage="Choose" />}
            </PlanLink>
          </td>
        );
      case 'component':
        return <td style={style}>{content.render()}</td>;
    }
  } else if (header) {
    return content ? (
      <th style={style}>{intl.formatMessage(messages[`table.head.${content}`])}</th>
    ) : (
      <th style={style}></th>
    );
  } else {
    return <td style={style}>{content}</td>;
  }
};

Cell.propTypes = {
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  type: PropTypes.string,
  header: PropTypes.bool,
  height: PropTypes.number,
};

class PricingTable extends React.Component {
  static propTypes = {
    headings: PropTypes.array,
    rows: PropTypes.array,
    footings: PropTypes.array,
  };

  constructor(props) {
    super(props);
    this.state = {
      cellHeights: [],
    };

    this.tableRef = React.createRef();
  }

  componentDidMount() {
    this.handleCellHeightResize();
    window.addEventListener('resize', this.handleCellHeightResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleCellHeightResize);
  }

  getTallestCellHeights = () => {
    const rows = Array.from(this.tableRef.current.getElementsByTagName('tr'));

    const heights = rows.map(row => {
      const fixedCell = row.childNodes[0];
      return Math.max(row.clientHeight, fixedCell.clientHeight);
    });

    return heights;
  };

  handleCellHeightResize = () => {
    this.setState({
      cellHeights: this.getTallestCellHeights(),
    });
  };

  renderHeadingRow = (cell, cellIndex) => {
    const { cellHeights } = this.state;

    return <Cell key={`heading-${cellIndex.toString()}`} content={cell} header={true} height={cellHeights[0]} />;
  };

  renderRow = (_row, rowIndex) => {
    const { rows } = this.props;
    const { cellHeights } = this.state;
    const heightIndex = rowIndex + 1;

    return (
      <tr key={`row-${rowIndex.toString()}`}>
        {rows[rowIndex].map((cell, cellIndex) => (
          <Cell key={`${rowIndex}-${cellIndex.toString()}`} content={cell} height={cellHeights[heightIndex]} />
        ))}
      </tr>
    );
  };

  renderFootingRow = (cell, cellIndex) => {
    const { cellHeights } = this.state;
    const heightIndex = cellHeights.length - 1;

    return (
      <Cell key={`footing-${cellIndex.toString()}`} content={cell} footer={true} height={cellHeights[heightIndex]} />
    );
  };

  render() {
    const { headings, rows, footings, ...props } = this.props;
    return (
      <Container display="flex" my={4} justifyContent="center" {...props}>
        <Wrapper>
          <StyledTable as="table" ref={this.tableRef}>
            <thead>
              <tr>{headings.map(this.renderHeadingRow)}</tr>
            </thead>
            <tbody>{rows.map(this.renderRow)}</tbody>
            <tfoot>
              <tr>{footings.map(this.renderFootingRow)}</tr>
            </tfoot>
          </StyledTable>
        </Wrapper>
      </Container>
    );
  }
}

export default PricingTable;
