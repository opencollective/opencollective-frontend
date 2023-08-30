import * as React from 'react';
import styled from 'styled-components';
import { layout, LayoutProps, padding, PaddingProps, textAlign, TextAlignProps } from 'styled-system';

const StyledTable = styled.div`
  width: 100%;
  overflow: auto;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  table {
    width: 100%;
    caption-side: bottom;
    border-collapse: collapse;
    border-spacing: 0px;
  }
`;

const StyledTableHeader = styled.thead.attrs<React.HTMLAttributes<HTMLTableSectionElement> & PaddingProps>(props => ({
  padding: props.padding || '16px',
}))`
  tr {
    border-bottom: 1px solid #e2e8f0;
  }
  th {
    ${padding}
  }
`;

const StyledTableBody = styled.tbody`
  tr:last-child {
    border: none;
  }
`;

const StyledTableFooter = styled.tfoot`
  background-color: #2d3748;
  font-weight: 500;
  color: #718096;
`;

const StyledTableRow = styled.tr<{ highlightOnHover?: boolean }>`
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease-in-out;

  &[data-state='selected'] {
    background-color: #edf2f7;
  }

  ${({ highlightOnHover }) =>
    highlightOnHover &&
    `&:hover {
        background-color: rgba(233, 236, 239, 0.5);
      }
  `}
`;

const StyledTableHead = styled.th`
  height: 1.9rem;
  padding-left: 16px;
  text-align: left;
  vertical-align: middle;
  font-weight: 400;
  color: #718096;

  &:has([role='checkbox']) {
    padding-right: 0;
  }

  ${textAlign}
  ${layout}
`;

const StyledTableCell = styled.td`
  vertical-align: middle;

  &:has([role='checkbox']) {
    padding-right: 0;
  }
`;

const StyledTableCaption = styled.caption`
  margin-top: 16px;
  color: #718096;
`;

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <StyledTable>
      <table ref={ref} className={className} {...props} />
    </StyledTable>
  ),
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<typeof StyledTableHeader>>(
  ({ className, ...props }, ref) => <StyledTableHeader ref={ref} className={className} {...props} />,
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <StyledTableBody ref={ref} className={className} {...props} />,
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <StyledTableFooter ref={ref} className={className} {...props} />,
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { highlightOnHover?: boolean }
>(({ className, highlightOnHover, ...props }, ref) => (
  <StyledTableRow ref={ref} highlightOnHover={highlightOnHover} className={className} {...props} />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & TextAlignProps & LayoutProps
>(({ className, ...props }, ref) => <StyledTableHead ref={ref} className={className} {...props} />);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => <StyledTableCell ref={ref} className={className} {...props} />,
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => <StyledTableCaption ref={ref} className={className} {...props} />,
);
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
