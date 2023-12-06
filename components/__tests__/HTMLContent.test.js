import 'jest-styled-components';

import React from 'react';

import { snapshot } from '../../test/snapshot-helpers';

import HTMLContent from '../HTMLContent';

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
