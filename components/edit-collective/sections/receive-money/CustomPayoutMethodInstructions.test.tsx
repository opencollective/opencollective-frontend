import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';

import { CustomPayoutMethodInstructions } from './CustomPayoutMethodInstructions';

describe('CustomPayoutMethodInstructions', () => {
  const defaultFormattedValues = {
    account: 'AC123456',
    reference: 'REF-789',
    OrderId: 'ORD-456',
    amount: '$100.00',
    collective: 'Test Collective',
  };

  describe('Rendering', () => {
    it('renders nothing for empty string', () => {
      const { container } = render(
        <CustomPayoutMethodInstructions instructions="" formattedValues={defaultFormattedValues} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing for null/undefined instructions', () => {
      const { container: container1 } = render(
        <CustomPayoutMethodInstructions
          instructions={null as unknown as string}
          formattedValues={defaultFormattedValues}
        />,
      );
      expect(container1.firstChild).toBeNull();

      const { container: container2 } = render(
        <CustomPayoutMethodInstructions
          instructions={undefined as unknown as string}
          formattedValues={defaultFormattedValues}
        />,
      );
      expect(container2.firstChild).toBeNull();
    });

    it('renders simple text without variables', () => {
      const instructions = 'Please send the payment to our account.';
      render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);

      expect(screen.getByText('Please send the payment to our account.')).toBeInTheDocument();
    });

    it('renders text with all variables replaced', () => {
      const instructions = 'Send {amount} to {account} for {collective}. Reference: {reference}. Order ID: {OrderId}.';
      render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);

      expect(screen.getByText(/Send \$100\.00 to AC123456 for Test Collective/)).toBeInTheDocument();
      expect(screen.getByText(/Reference: REF-789/)).toBeInTheDocument();
      expect(screen.getByText(/Order ID: ORD-456/)).toBeInTheDocument();
    });

    it('renders HTML content with variables', () => {
      const instructions = '<p>Send <strong>{amount}</strong> to <em>{account}</em></p>';
      render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);

      const strongElement = screen.getByText('$100.00');
      expect(strongElement.tagName).toBe('STRONG');

      const emElement = screen.getByText('AC123456');
      expect(emElement.tagName).toBe('EM');
    });

    it('ignores unknown variables and keeps them as-is', () => {
      const instructions = 'Known: {account}, Unknown: {unknownVar}, Another: {anotherUnknown}';
      render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);

      expect(screen.getByText(/Known: AC123456/)).toBeInTheDocument();
      expect(screen.getByText(/Unknown: \{unknownVar\}/)).toBeInTheDocument();
      expect(screen.getByText(/Another: \{anotherUnknown\}/)).toBeInTheDocument();
    });

    it('handles partial variable replacement', () => {
      const instructions = 'Account: {account}, Missing: {missingVar}, Amount: {amount}';
      const partialValues = {
        account: 'AC123456',
        amount: '$50.00',
      };

      render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={partialValues} />);

      expect(screen.getByText(/Account: AC123456/)).toBeInTheDocument();
      expect(screen.getByText(/Missing: \{missingVar\}/)).toBeInTheDocument();
      expect(screen.getByText(/Amount: \$50\.00/)).toBeInTheDocument();
    });

    it('does not crash on broken template with unclosed braces', () => {
      const instructions = 'Text with {unclosed brace and {account}';
      expect(() => {
        render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);
      }).not.toThrow();
    });

    it('does not crash on nested braces', () => {
      const instructions = 'Text with {{nested}} and {account}';
      expect(() => {
        render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);
      }).not.toThrow();

      // Should still replace the valid variable
      expect(screen.getByText(/AC123456/)).toBeInTheDocument();
    });

    it('does not crash on empty braces', () => {
      const instructions = 'Text with {} and {account}';
      expect(() => {
        render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);
      }).not.toThrow();

      // Should still replace the valid variable
      expect(screen.getByText(/AC123456/)).toBeInTheDocument();
    });

    it('handles variables with special characters in values', () => {
      const instructions = 'Amount: {amount}, Reference: {reference}';
      const valuesWithSpecialChars = {
        amount: '$1,234.56',
        reference: 'REF-123 & <Special>',
      };

      render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={valuesWithSpecialChars} />);

      expect(screen.getByText(/Amount: \$1,234\.56/)).toBeInTheDocument();
      expect(screen.getByText(/Reference: REF-123 & <Special>/)).toBeInTheDocument();
    });

    it('escapes HTML tags in collective name and does not render them as HTML', () => {
      const instructions = 'Payment for {collective}';
      const valuesWithHtmlInCollective = {
        collective: 'The <strong>Collective name</strong>',
      };

      const { container } = render(
        <CustomPayoutMethodInstructions instructions={instructions} formattedValues={valuesWithHtmlInCollective} />,
      );

      // Verify the HTML tags are displayed as text, not rendered as HTML
      expect(screen.getByText(/The <strong>Collective name<\/strong>/)).toBeInTheDocument();

      // Verify no actual <strong> HTML element is rendered
      const strongElements = container.querySelectorAll('strong');
      expect(strongElements).toHaveLength(0);

      // Verify the text content includes the escaped HTML tags
      expect(container.textContent).toContain('The <strong>Collective name</strong>');
    });

    it('applies custom className', () => {
      const instructions = 'Test instructions';
      const { container } = render(
        <CustomPayoutMethodInstructions
          instructions={instructions}
          formattedValues={defaultFormattedValues}
          className="custom-class"
        />,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('handles list formatting with variables', () => {
      const instructions = '<ul><li>Send {amount}</li><li>To {account}</li></ul>';
      render(<CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('list-disc');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
      expect(listItems[0]).toHaveTextContent('Send $100.00');
      expect(listItems[1]).toHaveTextContent('To AC123456');
    });

    it('handles multiple occurrences of the same variable', () => {
      const instructions = '{account} is the account. Use {account} for all payments.';
      const { container } = render(
        <CustomPayoutMethodInstructions instructions={instructions} formattedValues={defaultFormattedValues} />,
      );

      // Verify the text content contains the replaced value multiple times
      const textContent = container.textContent || '';
      const matches = textContent.match(/AC123456/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(2);

      // Verify the full text is rendered correctly
      expect(screen.getByText(/AC123456 is the account/)).toBeInTheDocument();
      expect(screen.getByText(/Use AC123456 for all payments/)).toBeInTheDocument();
    });
  });
});
