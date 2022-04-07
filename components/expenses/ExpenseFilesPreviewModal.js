import React from 'react';
import PropTypes from 'prop-types';
import { Download as DownloadIcon } from '@styled-icons/feather/Download';
import { saveAs } from 'file-saver';
import { FormattedDate, FormattedMessage } from 'react-intl';
import { v4 as uuid } from 'uuid';

import expenseTypes from '../../lib/constants/expenseTypes';

import Container from '../Container';
import ExpenseInvoiceDownloadHelper, {
  generateInvoiceBlob,
  getExpenseInvoiceFilename,
} from '../expenses/ExpenseInvoiceDownloadHelper';
import FilesPreviewModal from '../FilesPreviewModal';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import { P } from '../Text';
import UploadedFilePreview from '../UploadedFilePreview';

const FileInfo = ({ collective, expense, item, invoiceBlob }) => (
  <Flex justifyContent="space-between" px={25} mt={2}>
    <Box flex="1 1 65%">
      {item.description && (
        <P fontSize="14px" lineHeight="21px" color="black.900" mb={1}>
          {item.description}
        </P>
      )}
      <P fontSize="11px" color="black.500">
        <FormattedDate value={item.incurredAt} month="short" year="numeric" day="numeric" />
      </P>
    </Box>
    <Container ml={2} flex="1 1 35%" textAlign="right">
      <div>{item.amount && <FormattedMoneyAmount amount={item.amount} currency={expense.currency} />}</div>
      {invoiceBlob && (
        <StyledButton
          buttonSize="tiny"
          isBorderless
          mr="-12px"
          mt={1}
          onClick={() => saveAs(invoiceBlob, getExpenseInvoiceFilename(collective, expense))}
          fontSize
        >
          <DownloadIcon size="1em" /> <FormattedMessage id="Download" defaultMessage="Download" />
        </StyledButton>
      )}
    </Container>
  </Flex>
);

FileInfo.propTypes = {
  item: PropTypes.object,
  collective: PropTypes.object,
  expense: PropTypes.object,
  invoiceBlob: PropTypes.object,
};

const getFilesFromExpense = (collective, expense) => {
  if (!expense) {
    return [];
  }

  if (expense.type === expenseTypes.INVOICE) {
    return [
      {
        id: uuid(),
        amount: expense.amount,
        description: <FormattedMessage id="Expense.Type.Invoice" defaultMessage="Invoice" />,
        title: getExpenseInvoiceFilename(collective, expense),
        type: 'EXPENSE_INVOICE',
      },
      ...expense.attachedFiles,
    ];
  } else {
    const items = expense.items?.filter(({ url }) => Boolean(url)) || [];
    return [...items, ...expense.attachedFiles];
  }
};

const ExpenseInvoicePreview = ({ isLoading, fileURL }) => {
  if (isLoading) {
    return <UploadedFilePreview isDownloading width="100%" minHeight={350} />;
  } else {
    return <iframe title="Expense Invoice File URL" width="100%" height={350} src={fileURL} />;
  }
};

ExpenseInvoicePreview.propTypes = {
  isLoading: PropTypes.bool,
  fileURL: PropTypes.string,
};

const ExpenseFilesPreviewModal = ({ collective, expense, onClose }) => {
  const [invoiceFile, setInvoiceFile] = React.useState(false);
  const [invoiceBlob, setInvoiceBlob] = React.useState(null);
  const [invoiceError, setInvoiceError] = React.useState(false);
  const files = React.useMemo(() => getFilesFromExpense(collective, expense), [collective, expense]);

  React.useEffect(() => {
    generateInvoiceBlob(expense)
      .then(file => {
        setInvoiceError(false);
        setInvoiceBlob(file);
        setInvoiceFile(URL.createObjectURL(file));
      })
      .catch(() => {
        setInvoiceError(true);
      });
    return () => {
      if (invoiceFile) {
        URL.revokeObjectURL(invoiceFile);
      }
    };
  }, []);

  return (
    <FilesPreviewModal
      files={files}
      onClose={onClose}
      renderInfo={({ item }) => (
        <FileInfo
          collective={collective}
          expense={expense}
          item={item}
          invoiceBlob={item.type === 'EXPENSE_INVOICE' ? invoiceBlob : null}
        />
      )}
      renderItemPreview={({ item }) =>
        item.type === 'EXPENSE_INVOICE' ? (
          invoiceError ? (
            <ExpenseInvoiceDownloadHelper expense={expense} collective={collective}>
              {({ isLoading, downloadInvoice }) => (
                <UploadedFilePreview
                  onClick={downloadInvoice}
                  isDownloading={isLoading}
                  fileName={getExpenseInvoiceFilename(collective, expense)}
                  size={350}
                />
              )}
            </ExpenseInvoiceDownloadHelper>
          ) : (
            <ExpenseInvoicePreview isLoading={!invoiceFile} fileURL={invoiceFile} />
          )
        ) : (
          <UploadedFilePreview url={item.url} size={350} hasLink title={item.title} />
        )
      }
    />
  );
};

ExpenseFilesPreviewModal.propTypes = {
  collective: PropTypes.object,
  expense: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default ExpenseFilesPreviewModal;
