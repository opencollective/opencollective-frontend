import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { CaretDown } from '@styled-icons/fa-solid/CaretDown';
import { CaretUp } from '@styled-icons/fa-solid/CaretUp';
import { Markup } from 'interweave';
import { merge, pick } from 'lodash';
import { getLuminance } from 'polished';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import { space, typography } from 'styled-system';

/**
 * React-Quill usually saves something like `<p><br/></p` when saving with an empty
 * editor. This function tries to detect this and returns true if there's no real
 * text, image or iframe contents.
 */
export const isEmptyHTMLValue = value => {
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

const ReadFullLink = styled.a`
  cursor: pointer;
  font-size: 12px;
  > svg {
    vertical-align: baseline;
  }
`;

const InlineDisplayBox = styled.div`
  overflow-y: hidden;
  p {
    margin: 1em 0;
  }
  ${props => props.maxHeight && `max-height: ${props.maxHeight + 20}px;`}
`;

const CollapsedDisplayBox = styled.div`
  overflow-y: hidden;
  ${props => props.maxHeight && `max-height: ${props.maxCollapsedHeight + 20}px;`}
  -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
`;

/**
 * `RichTextEditor`'s associate, this component will display raw HTML with some CSS
 * resets to ensure we don't mess with the styles. Content can be omitted if you're
 * just willing to take the styles, for example to match the content displayed in the
 * editor with how it's rendered on the page.
 *
 * ⚠️ Be careful! Though this component uses Markup from interweave as a double-safety mechanism to sanitize the input,
 * always ensure `content` is properly sanitized in the API (using `api/server/lib/sanitize-html.ts`)
 */
const HTMLContent = styled(
  ({
    content,
    collapsable = false,
    maxHeight = undefined,
    maxCollapsedHeight = 20,
    collapsePadding = 1,
    hideViewMoreLink = false,
    openLinksInNewTab = false,
    ...props
  }) => {
    const [isOpen, setOpen] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const contentRef = useRef();

    const DisplayBox = !isCollapsed || isOpen ? InlineDisplayBox : CollapsedDisplayBox;

    useEffect(() => {
      if (collapsable && contentRef?.current?.clientHeight > maxCollapsedHeight + collapsePadding) {
        setIsCollapsed(true);
      }
    }, [content]);

    if (!content) {
      return <div {...props} />;
    }

    return (
      <div>
        <DisplayBox ref={contentRef} maxHeight={maxHeight} maxCollapsedHeight={maxCollapsedHeight} {...props}>
          {/* See api/server/lib/sanitize-html.ts */}
          <Markup
            noWrap
            content={content}
            allowAttributes
            transform={node => {
              // Allow some iframes
              if (node.tagName === 'iframe') {
                const src = node.getAttribute('src');
                const parsedUrl = new URL(src);
                const hostname = parsedUrl.hostname;
                if (['youtube-nocookie.com', 'www.youtube-nocookie.com', 'anchor.fm'].includes(hostname)) {
                  const attributes = merge({}, ...node.attributes.map(({ name, value }) => ({ [name]: value })));
                  return (
                    <iframe
                      {...pick(attributes, ['width', 'height', 'frameborder', 'allowfullscreen'])}
                      title={attributes.title || 'Embed content'}
                      src={src}
                    />
                  );
                }
              } else if (node.tagName === 'a') {
                // Open links in new tab
                if (openLinksInNewTab) {
                  node.setAttribute('target', '_blank');
                  node.setAttribute('rel', 'noopener noreferrer');
                }
              }
            }}
          />
        </DisplayBox>
        {!isOpen && isCollapsed && !hideViewMoreLink && (
          <ReadFullLink
            onClick={() => setOpen(true)}
            {...props}
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                setOpen(true);
              }
            }}
          >
            <FormattedMessage id="ExpandDescription" defaultMessage="Read full description" />
            <CaretDown size="10px" />
          </ReadFullLink>
        )}
        {isOpen && isCollapsed && (
          <ReadFullLink
            onClick={() => setOpen(false)}
            {...props}
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                setOpen(false);
              }
            }}
          >
            <FormattedMessage defaultMessage="Collapse" />
            <CaretUp size="10px" />
          </ReadFullLink>
        )}
      </div>
    );
  },
)`
  /** Override global styles to match what we have in the editor */
  width: 100%;
  line-height: 1.75em;
  overflow-wrap: break-word;

  h1,
  h2,
  h3 {
    margin: 0;
    font-weight: normal;
    text-align: left;
  }

  h3 {
    font-size: 1.25em;
    margin-bottom: 0.25em;
  }

  figure {
    margin: 0;
    &[data-trix-content-type='--embed-iframe-video'] {
      position: relative;
      padding-bottom: 56.25%; /* proportion value to aspect ratio 16:9 (9 / 16 = 0.5625 or 56.25%) */
      height: 0;
      overflow: hidden;
      iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }
    &[data-trix-content-type='--embed-iframe-anchorFm'] {
      iframe {
        min-height: 300px;
      }
    }
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
    background: white;
    color: #757677;
    margin: 0;
    padding: 16px;
  }

  pre {
    font-size: 0.85em;
    background: #f6f8fa;
    color: #333;
    border: none;
    padding: 16px;
    font-family: monospace;
    overflow-x: auto;
    max-width: 100%;
    white-space: nowrap;
    border-radius: 4px;
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  ul li,
  ol li {
    margin-left: 1.5em;
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
  content: PropTypes.string,
  /* Whether the content is collapsible; adds a blur effect and a show/hide link. */
  collapsable: PropTypes.bool,
  /* The maximum a height of the content. */
  maxHeight: PropTypes.number,
  /* The maximum a height of the content before being collapsed. */
  maxCollapsedHeight: PropTypes.number,
  /* The the padding to apply to the collapse blur; useful in the case of
   *  making sure only the blur effect is not applied unnecessarily. For
   *  example maxCollapsedHeight=20 and collapsePadding=22 ensure that
   *  content is collapsed only when there's more than two lines and if there's
   *  only two lines the blur effect is not applied.
   */
  collapsePadding: PropTypes.number,
  /* Hides the "Read full description/collapse" link */
  hideViewMoreLink: PropTypes.bool,
  openLinksInNewTab: PropTypes.bool,
};

HTMLContent.defaultProps = {
  fontSize: '14px',
};

export default HTMLContent;
