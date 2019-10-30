import React from 'react';
import PropTypes from 'prop-types';
import { getLuminance } from 'polished';
import styled, { css } from 'styled-components';
import { typography, space } from 'styled-system';

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

/**
 * `HTMLEditor`'s associate, this component will display raw HTML with some CSS
 * resets to ensure we don't mess with the styles. Content can be omitted if you're
 * just willing to take the styles, for example to match the content displayed in the
 * editor with how it's rendered on the page.
 *
 * ⚠️ Be careful! This component will pass content to `dangerouslySetInnerHTML` so
 * always ensure `content` is properly sanitized!
 */
const HTMLContent = styled(({ content, ...props }) => {
  return content ? <div dangerouslySetInnerHTML={{ __html: content }} {...props} /> : <div {...props} />;
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

  ul {
    padding: 0;
    padding-left: 0 0 0 0.5em;
    position: relative;

    li {
      list-style: none;
      position: relative;
      padding: 0 0 0 1em;
      margin-bottom: 0.4em;

      & > p:first-child {
        display: inline;
      }
      
      &::before {
        content: "◯";
        margin-right: 0.75em;
        font-size: 0.9em;
        vertical-align: top;
      }
      
      /** Nested list, depth: 1 */
      ul {
        li {
          padding: 0 0 0 2em;
          margin-bottom: 0;
          &::before {
            content: "▷";
          }
          
          /** Nested list, depth >= 2 */
          li::before {
            content: "■";
            font-size: 1em;
          }
        }
      }
    }
  }

  ${typography}
  ${space}
  
  // Apply custom theme if the color is safe to apply

  ${props => {
    let primaryColor = props.theme.colors.primary[500];
    let secondaryColor = props.theme.colors.primary[100];
    const luminance = getLuminance(primaryColor);

    if (luminance < 0 || luminance > 0.9) {
      return null;
    } else if (luminance < 0.05) {
      primaryColor = props.theme.colors.primary[400];
      secondaryColor = props.theme.colors.primary[100];
    } else if (luminance > 0.75) {
      primaryColor = props.theme.colors.primary[900];
      secondaryColor = props.theme.colors.primary[500];
    }

    return css`
      a {
        color: ${primaryColor};
        &:hover {
          color: ${secondaryColor};
        }
      }

      ul li::before {
        color: ${primaryColor};
      }
    `;
  }}
`;

HTMLContent.propTypes = {
  /** The HTML string. Makes sure this is sanitized properly! */
  content: PropTypes.string,
};

HTMLContent.defaultProps = {
  fontSize: 'Paragraph',
};

export default HTMLContent;
