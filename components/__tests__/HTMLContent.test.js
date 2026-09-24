import 'jest-styled-components';

import React from 'react';

import { snapshot } from '../../test/snapshot-helpers';

import HTMLContent, { isEmptyHTMLValue, normalizeRichTextContent } from '../HTMLContent';

describe('HTMLContent', () => {
  it('renders simple HTML string', () => {
    snapshot(<HTMLContent content="A <strong>short</strong> string" />);
  });

  it('cannot inject malicious content', () => {
    snapshot(
      <HTMLContent
        content={`
          <div>
            Script:
            <script> alert('hello'); </script>

            Iframe:
            <iframe src="https://example.com/image.png"></iframe>

            Normal string:
            A <strong>short</strong> string

            Another script:
            A <script src="https://example.com/image.png" />

            Some more text:
            Hello World
          </div>
        `}
      />,
    );
  });

  it('handles broken HTML', () => {
    snapshot(<HTMLContent content="<p>Broken <strong>HTML</body></html>" />);
  });
});

describe('isEmptyHTMLValue', () => {
  it('detects empty rich-text scaffold HTML', () => {
    expect(isEmptyHTMLValue('')).toBe(true);
    expect(isEmptyHTMLValue('<div><br></div>')).toBe(true);
    expect(isEmptyHTMLValue('<div><!--block--><br></div>')).toBe(true);
    expect(isEmptyHTMLValue('<p><br/></p>')).toBe(true);
  });

  it('detects non-empty rich-text content', () => {
    expect(isEmptyHTMLValue('<p>Hello</p>')).toBe(false);
    expect(isEmptyHTMLValue('<div><img src="x.png"></div>')).toBe(false);
  });
});

describe('normalizeRichTextContent', () => {
  it('returns empty string for scaffold HTML', () => {
    expect(normalizeRichTextContent('<div><br></div>')).toBe('');
    expect(normalizeRichTextContent('')).toBe('');
  });

  it('returns original value for real content', () => {
    const content = '<p>Item description</p>';
    expect(normalizeRichTextContent(content)).toBe(content);
  });
});
