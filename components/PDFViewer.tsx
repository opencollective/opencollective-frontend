import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Document, Page, pdfjs } from 'react-pdf';
import styled from 'styled-components';

import { getI18nLink } from './I18nFormatters';
import Loading from './Loading';
import { Span } from './Text';

pdfjs.GlobalWorkerOptions.workerSrc = '/static/scripts/pdf.worker.min.js';

const DocumentContainer = styled.div`
  .pdf-page {
    margin-bottom: 16px;
  }
`;

const options = {
  cMapUrl: `/static/cmaps/`,
  cMapPacked: true,
};

const PDFViewer = ({ pdfUrl, contentWrapperRef, errorTextColor = 'white.full', ...props }) => {
  const [numPages, setNumPages] = useState(null);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  const throttledSetWrapperWidth = useCallback(
    throttle(w => {
      setWrapperWidth(w);
    }, 500),
    [],
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        throttledSetWrapperWidth(entry.target.clientWidth);
      }
    });

    resizeObserver.observe(contentWrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <DocumentContainer>
      <Document
        file={pdfUrl}
        loading={<Loading />}
        options={options}
        error={
          <Span color={errorTextColor} fontSize={'16px'}>
            <FormattedMessage defaultMessage="Failed to load PDF file." id="PDFViewer.error" />{' '}
            <FormattedMessage
              defaultMessage="<Link>Click here</Link> to open the file in a new tab."
              id="PDFViewer.errorLink"
              values={{ Link: getI18nLink({ href: pdfUrl, openInNewTab: true }) }}
            />
          </Span>
        }
        {...props}
        onLoadSuccess={pdfDetails => {
          setNumPages(pdfDetails.numPages);
          props.onLoadSuccess?.(pdfDetails);
        }}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page
            className="pdf-page"
            pageNumber={index + 1}
            key={`page_${index + 1}`}
            onLoadSuccess={page => {
              if (page._pageIndex === 0) {
                // Use first page's width as default page width
                // and set it to 1.5 times of original width
                // to make it more readable
                setPageWidth(page.originalWidth * 1.5);
              }
            }}
            width={Math.min(wrapperWidth, pageWidth)}
          />
        ))}
      </Document>
    </DocumentContainer>
  );
};

PDFViewer.propTypes = {
  pdfUrl: PropTypes.string.isRequired,
  contentWrapperRef: PropTypes.object.isRequired,
};

export default PDFViewer;
