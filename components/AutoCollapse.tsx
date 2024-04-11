import React from 'react';
import { CaretDown } from '@styled-icons/fa-solid/CaretDown';
import { CaretUp } from '@styled-icons/fa-solid/CaretUp';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import StyledLink from './StyledLink';

type DisplayBoxProps = {
  $maxCollapsedHeight?: number;
};

const InlineDisplayBox = styled.div<DisplayBoxProps>`
  overflow-y: hidden;
`;

const CollapsedDisplayBox = styled.div<DisplayBoxProps>`
  overflow-y: hidden;
  ${props => props.$maxCollapsedHeight && `max-height: ${props.$maxCollapsedHeight + 20}px;`}
  -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
`;

/* The the padding to apply to the collapse blur; useful in the case of making sure only the blur effect is not applied unnecessarily. For
 * example maxCollapsedHeight=20 and collapsePadding=22 ensure that content is collapsed only when there's more than two lines and if there's
 * only two lines the blur effect is not applied.
 */
const COLLAPSE_PADDING = 20;

type AutoCollapseProps = {
  children: React.ReactNode;
  /* The maximum a height of the content before being collapsed. */
  maxCollapsedHeight: number;
};

/**
 * Autocollapse component based on `components/HTMLContent.js`
 */
export const AutoCollapse = ({ children, maxCollapsedHeight }: AutoCollapseProps) => {
  const [isOpen, setOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>();
  const DisplayBox = !isCollapsed || isOpen ? InlineDisplayBox : CollapsedDisplayBox;

  const toggleIsOpen = () => setOpen(!isOpen);

  React.useEffect(() => {
    if (contentRef.current) {
      if (contentRef.current.clientHeight > maxCollapsedHeight + COLLAPSE_PADDING) {
        setIsCollapsed(true);
      }
    }
  }, [children]);

  return (
    <React.Fragment>
      <DisplayBox ref={contentRef} $maxCollapsedHeight={maxCollapsedHeight}>
        {children}
      </DisplayBox>
      {isCollapsed && (
        <StyledLink
          as="button"
          mt={2}
          onClick={toggleIsOpen}
          role="button"
          tabIndex={0}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              toggleIsOpen();
            }
          }}
        >
          {!isOpen ? (
            <React.Fragment>
              <FormattedMessage id="ExpandDescription" defaultMessage="Read full description" />
              <CaretDown size="10px" />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <FormattedMessage defaultMessage="Collapse" id="W/V6+Y" />
              <CaretUp size="10px" />
            </React.Fragment>
          )}
        </StyledLink>
      )}
    </React.Fragment>
  );
};
