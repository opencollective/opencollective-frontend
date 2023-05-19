import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
import styled from 'styled-components';

const DocumentContainer = styled.div`
  .pdf-page {
    margin-bottom: 16px;
  }
`;

const PDFViewer = ({ pdfUrl, contentWrapperRef }) => {
  const [numPages, setNumPages] = useState(null);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const [firstPageWidth, setFirstPageWidth] = useState(0);

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
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
        }}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page
            className="pdf-page"
            scale={1}
            pageNumber={index + 1}
            key={`page_${index + 1}`}
            onLoadSuccess={page => {
              if (page._pageIndex === 0) {
                setFirstPageWidth(page.originalWidth);
              }
            }}
            width={Math.min(wrapperWidth, firstPageWidth)}
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
