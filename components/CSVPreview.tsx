import React from 'react';
import { parse as parseCSV } from 'csv-parse/sync';
import { FormattedMessage } from 'react-intl';

import { fetchCSVContentFromRESTService } from '../lib/api';
import { cn, getWebsiteUrl } from '../lib/utils';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Loading from './Loading';

/** Rows past this limit are not rendered, the user must download the file to see them */
export const CSV_PREVIEW_MAX_ROWS = 500;

const NUMERIC_CELL_REGEX = /^[-+]?\d[\d,.\s]*$/;

/**
 * Fetches the CSV content. The access token is only sent to the REST service, and only REST service
 * and uploaded files (served from this website under `/api/files`) are previewed.
 */
const fetchCSVContent = async (url: string, signal: AbortSignal): Promise<string> => {
  const parsedUrl = new URL(url, getWebsiteUrl());
  if (process.env.REST_URL && parsedUrl.origin === new URL(process.env.REST_URL).origin) {
    return fetchCSVContentFromRESTService(parsedUrl.toString(), { signal });
  } else if (parsedUrl.origin === getWebsiteUrl() && parsedUrl.pathname.startsWith('/api/files/')) {
    const response = await fetch(parsedUrl.toString(), { credentials: 'same-origin', signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch file (${response.status})`);
    }
    return response.text();
  } else {
    throw new Error('Preview not supported for this URL');
  }
};

const parseCSVContent = (content: string) => {
  // Parse one extra record to know whether the file has more rows than what we display
  const records: string[][] = parseCSV(content, {
    bom: true,
    relaxColumnCount: true,
    relaxQuotes: true,
    skipEmptyLines: true,
    to: CSV_PREVIEW_MAX_ROWS + 2,
  });

  const [headers = [], ...rows] = records;
  return {
    headers,
    rows: rows.slice(0, CSV_PREVIEW_MAX_ROWS),
    isTruncated: rows.length > CSV_PREVIEW_MAX_ROWS,
  };
};

type CSVPreviewProps = {
  url: string;
  /** Rendered instead of the table when the file can't be fetched or parsed */
  renderFallback: () => React.ReactNode;
};

/**
 * Renders a CSV file as a table. Cells are rendered as text, never as HTML.
 */
const CSVPreview = ({ url, renderFallback }: CSVPreviewProps) => {
  const [state, setState] = React.useState<{
    loading: boolean;
    error?: Error;
    data?: ReturnType<typeof parseCSVContent>;
  }>({ loading: true });

  React.useEffect(() => {
    const abortController = new AbortController();
    setState({ loading: true });
    fetchCSVContent(url, abortController.signal)
      .then(content => setState({ loading: false, data: parseCSVContent(content) }))
      .catch(error => {
        if (!abortController.signal.aborted) {
          setState({ loading: false, error });
        }
      });

    return () => abortController.abort();
  }, [url]);

  const numericColumns = React.useMemo(() => {
    if (!state.data) {
      return [];
    }

    return state.data.headers.map((_, columnIdx) => {
      const values = state.data.rows.map(row => row[columnIdx]).filter(Boolean);
      return values.length > 0 && values.every(value => NUMERIC_CELL_REGEX.test(value));
    });
  }, [state.data]);

  if (state.loading) {
    return <Loading />;
  } else if (state.error || !state.data?.headers.length) {
    return renderFallback();
  }

  const { headers, rows, isTruncated } = state.data;
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-lg" data-cy="csv-preview">
      <Table
        className="max-h-[calc(100dvh-74px-10rem)] rounded-none border-0"
        innerClassName="text-xs"
        data-cy="csv-preview-table"
      >
        <TableHeader className="sticky top-0 z-10 bg-slate-50">
          <TableRow highlightOnHover={false}>
            {headers.map((header, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <TableHead key={idx} className={cn('h-9 whitespace-nowrap', numericColumns[idx] && 'text-right')}>
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIdx) => (
            // eslint-disable-next-line react/no-array-index-key
            <TableRow key={rowIdx}>
              {headers.map((_, columnIdx) => (
                <TableCell
                  // eslint-disable-next-line react/no-array-index-key
                  key={columnIdx}
                  className={cn(
                    'h-auto min-h-0 py-1.5 whitespace-nowrap',
                    numericColumns[columnIdx] && 'text-right tabular-nums',
                  )}
                >
                  {row[columnIdx]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        {isTruncated ? (
          <FormattedMessage
            defaultMessage="Showing the first {count} rows. Download the file to see all of them."
            id="MBoUNC"
            values={{ count: rows.length }}
          />
        ) : (
          <FormattedMessage
            defaultMessage="{count, plural, one {# row} other {# rows}}"
            id="fad/lV"
            values={{ count: rows.length }}
          />
        )}
      </div>
    </div>
  );
};

export default CSVPreview;
