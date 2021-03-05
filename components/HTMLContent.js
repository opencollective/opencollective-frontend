import React from 'react';
import PropTypes from 'prop-types';
import { CaretDown } from '@styled-icons/fa-solid/CaretDown';
import { getLuminance } from 'polished';
import { FormattedMessage } from 'react-intl';
import sanitizeHtml from 'sanitize-html';
import styled, { css } from 'styled-components';
import { space, typography } from 'styled-system';

/**
 * React-Quill usually saves something like `<p><br/></p` when saving with an empty
 * editor. This function tries to detect this and returns true if there's no real
 * text, image or iframe contents.
 */
export const isEmptyValue = value => {
  if (!value) {
    return true;
  } else if (value.length > 50) {
    // Running the regex on long strings can be costly, and there's very few chances
    // to have a blank content with tons of empty markup.
    return false;
  } else if (/(<img)|(<iframe)|(<video)/.test(value)) {
    // If the content has no text but has an image or an iframe (video) then it's not blank
    return false;
  } else {
    // Strip all tags and check if there's something left
    const cleanStr = value.replace(/(<([^>]+)>)/gi, '');
    return cleanStr.length === 0;
  }
};

const getFirstSentenceFromHTML = html => html.split?.(/<\/?\w+>/).filter(a => a.length)[0] || '';

const ReadFullLink = styled.a`
  cursor: pointer;
  font-size: 12px;
  > svg {
    vertical-align: baseline;
  }
`;

const DisplayBox = styled.div`
  display: inline;
`;

/**
 * `HTMLEditor`'s associate, this component will display raw HTML with some CSS
 * resets to ensure we don't mess with the styles. Content can be omitted if you're
 * just willing to take the styles, for example to match the content displayed in the
 * editor with how it's rendered on the page.
 *
 * ⚠️ Be careful! This component will pass content to `dangerouslySetInnerHTML` so
 * always ensure `content` is properly sanitized!
 */
const HTMLContent = styled(({ content, collapsable, sanitize, ...props }) => {
  const [isOpen, setOpen] = React.useState(false);
  if (!content) {
    return <div {...props} />;
  }
  let __html = sanitize ? sanitizeHtml(content) : content;

  if (collapsable && !isOpen) {
    __html = getFirstSentenceFromHTML(__html);
  }

  return (
    <div>
      <DisplayBox collapsed={collapsable && !isOpen} dangerouslySetInnerHTML={{ __html }} {...props} />
      {!isOpen && collapsable && (
        <ReadFullLink
          onClick={() => setOpen(true)}
          {...props}
          role="button"
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          &nbsp;
          <FormattedMessage id="ExpandDescription" defaultMessage="Read full description" />
          <CaretDown size="10px" />
        </ReadFullLink>
      )}
    </div>
  );
})`
  /** Override global styles to match what we have in the editor */
  width: 100%;
  line-height: 1.75em;
  word-break: break-word;

  h1,
  h2,
  h3 {
    margin: 0;
    margin-bottom: 0.5em;
    font-weight: normal;
    text-align: left;
  }

  img {
    max-width: 100%;
  }

  /** Legacy styles for react-quill */

  .ql-align-center {
    text-align: center;
  }

  .ql-align-right {
    text-align: right;
  }

  .ql-align-left {
    text-align: left;
  }

  blockquote {
    font-size: 1em;
    border-left: 5px solid #e9e9e9;
    background-color: #f9f9f9;
    margin: 0;
    padding: 8px;
  }

  pre {
    font-size: 1em;
    background: #f7f8fa;
    color: #76777a;
    border: none;
    padding: 8px 16px;
    font-familly: Courier;
  }

  ${typography}
  ${space}
  
  // Apply custom theme if the color is safe to apply

  ${props => {
    let primaryColor = props.theme.colors.primary[500];
    let secondaryColor = props.theme.colors.primary[400];
    const luminance = getLuminance(primaryColor);

    if (luminance < 0 || luminance > 0.9) {
      return null;
    } else if (luminance < 0.06) {
      primaryColor = props.theme.colors.primary[400];
      secondaryColor = props.theme.colors.primary[200];
    } else if (luminance > 0.6) {
      primaryColor = props.theme.colors.primary[900];
      secondaryColor = props.theme.colors.primary[700];
    }

    return css`
      a {
        color: ${primaryColor};
        &:hover {
          color: ${secondaryColor};
        }
      }
    `;
  }}
`;

HTMLContent.propTypes = {
  /** The HTML string. Makes sure this is sanitized properly! */
  content: PropTypes.string,
  sanitize: PropTypes.bool,
  collapsable: PropTypes.bool,
};

HTMLContent.defaultProps = {
  fontSize: '14px',
  sanitize: false,
};

export default HTMLContent;
