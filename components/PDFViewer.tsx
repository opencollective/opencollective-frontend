import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Document, Page, pdfjs } from 'react-pdf';
import styled from 'styled-components';

import Container from './Container';
import { getI18nLink } from './I18nFormatters';
import Loading from './Loading';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

const DocumentContainer = styled.div`
  .pdf-page {
    margin-bottom: 16px;
  }
`;

const options = {
  cMapUrl: `/static/cmaps/`,
  cMapPacked: true,
};

const PDFViewer = ({ pdfUrl, contentWrapperRef, errorTextColor = 'white.full', limitToPageWidth = true, ...props }) => {
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
          <Container color={errorTextColor} fontSize="16px" p={4}>
            <FormattedMessage defaultMessage="Failed to load PDF file." id="PDFViewer.error" />{' '}
            <FormattedMessage
              defaultMessage="<Link>Click here</Link> to open the file in a new tab."
              id="PDFViewer.errorLink"
              values={{ Link: getI18nLink({ href: pdfUrl, openInNewTab: true }) }}
            />
          </Container>
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
            loading={null}
            onLoadSuccess={page => {
              if (page._pageIndex === 0) {
                // Use first page's width as default page width
                // and set it to 1.5 times of original width
                // to make it more readable
                setPageWidth(page.originalWidth * 1.5);
              }
            }}
            width={limitToPageWidth ? Math.min(wrapperWidth, pageWidth) : wrapperWidth}
          />
        ))}
      </Document>
    </DocumentContainer>
  );
};

PDFViewer.propTypes = {
  pdfUrl: PropTypes.string.isRequired,
  contentWrapperRef: PropTypes.object.isRequired,
  loading: PropTypes.node,
  limitToPageWidth: PropTypes.bool,
};

export default PDFViewer;
