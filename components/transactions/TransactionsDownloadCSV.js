import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import dayjs from 'dayjs';
import { FormattedMessage, useIntl } from 'react-intl';

import { fetchCSVFileFromRESTService } from '../../lib/api';
import { parseDateInterval } from '../../lib/date-utils';
import { formatErrorMessage } from '../../lib/errors';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';
import { TOAST_TYPE, useToasts } from '../ToastProvider';
import { getDefaultKinds } from '../transactions/filters/TransactionsKindFilter';

const TransactionsDownloadCSV = ({ collective, query }) => {
  const intl = useIntl();
  const [loading, setLoading] = React.useState(null);
  const { addToast } = useToasts();
  let dateFrom, dateTo;
  if (query.period) {
    ({ from: dateFrom, to: dateTo } = parseDateInterval(query.period));
  }

  const downloadV2 = async event => {
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (!accessToken) {
      return;
    }

    event.preventDefault();

    try {
      setLoading('v2');
      await fetchCSVFileFromRESTService(downloadUrl(), `${collective.slug}-transactions`);
    } catch (error) {
      addToast({ type: TOAST_TYPE.ERROR, message: formatErrorMessage(intl, error) });
    } finally {
      setLoading(null);
    }
  };

  const downloadUrl = () => {
    const format = 'txt';

    const url = new URL(`${process.env.REST_URL}/v2/${collective.slug}/transactions.${format}`);

    if (query.kind) {
      url.searchParams.set('kind', query.kind);
    } else {
      url.searchParams.set('kind', getDefaultKinds().join(','));
    }

    if (query.type) {
      url.searchParams.set('type', query.type);
    }

    if (query.searchTerm) {
      url.searchParams.set('searchTerm', query.searchTerm);
    }

    if (query.amount) {
      if (query.amount.includes('-')) {
        const [minAmount, maxAmount] = query.amount.split('-');
        if (minAmount) {
          url.searchParams.set('minAmount', Number(minAmount) * 100);
        }
        if (maxAmount) {
          url.searchParams.set('maxAmount', Number(maxAmount) * 100);
        }
      } else if (query.amount.includes('+')) {
        const minAmount = query.amount.replace('+', '');
        if (minAmount) {
          url.searchParams.set('minAmount', Number(minAmount) * 100);
        }
      }
    }

    if (dateFrom) {
      url.searchParams.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      url.searchParams.set('dateTo', dateTo);
    }

    if (!query.ignoreGiftCardsTransactions) {
      url.searchParams.set('includeGiftCardTransactions', '1');
    }
    if (!query.ignoreIncognitoTransactions) {
      url.searchParams.set('includeIncognitoTransactions', '1');
    }
    if (!query.ignoreChildrenTransactions) {
      url.searchParams.set('includeChildrenTransactions', '1');
    }

    if (dateFrom) {
      // Is the diff between dateFrom and dateTo (or today) less than 62 days?
      if (dayjs(dateTo || undefined).unix() - dayjs(dateFrom).unix() < 62 * 24 * 60 * 60) {
        url.searchParams.set('fetchAll', '1');
      }
    }

    return url.toString();
  };

  return (
    <StyledTooltip
      content={
        <FormattedMessage
          id="Transactions.DownloadCSV.Description"
          defaultMessage="Use the filters to define the transactions you would like to download."
        />
      }
    >
      <StyledButton
        data-cy="download-csv"
        onClick={downloadV2}
        buttonSize="small"
        minWidth={140}
        height={38}
        mb="8px"
        p="6px 10px"
        isBorderless
        loading={loading === 'v2'}
        flexGrow={1}
      >
        <FormattedMessage id="transactions.downloadcsvbutton" defaultMessage="Download CSV" />
        <IconDownload size="13px" style={{ marginLeft: '8px' }} />
      </StyledButton>
    </StyledTooltip>
  );
};

TransactionsDownloadCSV.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    legacyId: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
  client: PropTypes.object,
  query: PropTypes.shape({
    type: PropTypes.string,
    kind: PropTypes.string,
    amount: PropTypes.string,
    period: PropTypes.string,
    searchTerm: PropTypes.string,
    ignoreIncognitoTransactions: PropTypes.string,
    ignoreGiftCardsTransactions: PropTypes.string,
    ignoreChildrenTransactions: PropTypes.string,
  }),
};

export default withApollo(TransactionsDownloadCSV);
