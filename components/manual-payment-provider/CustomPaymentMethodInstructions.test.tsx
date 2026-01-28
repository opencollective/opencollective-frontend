import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';

import { Currency } from '@/lib/graphql/types/v2/schema';
import { withRequiredProviders } from '../../test/providers';

import { CustomPaymentMethodInstructions } from './CustomPaymentMethodInstructions';

describe('CustomPaymentMethodInstructions', () => {
  const defaultValues = {
    amount: { valueInCents: 10000, currency: Currency.USD },
    collectiveSlug: 'test-collective',
    OrderId: 789,
    accountDetails: { accountNumber: 'AC123456' },
  };

  describe('Rendering', () => {
    it('renders nothing for empty string', () => {
      const { container } = render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions="" values={defaultValues} />),
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing for null/undefined instructions', () => {
      const { container: container1 } = render(
        withRequiredProviders(
          <CustomPaymentMethodInstructions instructions={null as unknown as string} values={defaultValues} />,
        ),
      );
      expect(container1.firstChild).toBeNull();

      const { container: container2 } = render(
        withRequiredProviders(
          <CustomPaymentMethodInstructions instructions={undefined as unknown as string} values={defaultValues} />,
        ),
      );
      expect(container2.firstChild).toBeNull();
    });

    it('renders simple text without variables', () => {
      const instructions = 'Please send the payment to our account.';
      render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
      );

      expect(screen.getByText('Please send the payment to our account.')).toBeInTheDocument();
    });

    it('renders text with all variables replaced', () => {
      const instructions = 'Send {amount} for {collective}. Reference: {reference}. Order ID: {OrderId}.';
      render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
      );

      expect(screen.getByText(/Send \$100\.00 for test-collective/)).toBeInTheDocument();
      expect(screen.getByText(/Reference: 789/)).toBeInTheDocument();
      expect(screen.getByText(/Order ID: 789/)).toBeInTheDocument();
    });

    it('renders HTML content with variables', () => {
      const instructions = '<p>Send <strong>{amount}</strong> for <em>{collective}</em></p>';
      render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
      );

      const strongElement = screen.getByText('$100.00');
      expect(strongElement.tagName).toBe('STRONG');

      const emElement = screen.getByText('test-collective');
      expect(emElement.tagName).toBe('EM');
    });

    it('ignores unknown variables and keeps them as-is', () => {
      const instructions = 'Known: {collective}, Unknown: {unknownVar}, Another: {anotherUnknown}';
      render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
      );

      expect(screen.getByText(/Known: test-collective/)).toBeInTheDocument();
      expect(screen.getByText(/Unknown: \{unknownVar\}/)).toBeInTheDocument();
      expect(screen.getByText(/Another: \{anotherUnknown\}/)).toBeInTheDocument();
    });

    it('handles unknown variables gracefully', () => {
      const instructions = 'Collective: {collective}, Missing: {missingVar}, Amount: {amount}';

      render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
      );

      expect(screen.getByText(/Collective: test-collective/)).toBeInTheDocument();
      expect(screen.getByText(/Missing: \{missingVar\}/)).toBeInTheDocument();
      expect(screen.getByText(/Amount: \$100\.00/)).toBeInTheDocument();
    });

    it('does not crash on broken template with unclosed braces', () => {
      const instructions = 'Text with {unclosed brace and {collective}';
      expect(() => {
        render(
          withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
        );
      }).not.toThrow();
    });

    it('does not crash on nested braces', () => {
      const instructions = 'Text with {{nested}} and {collective}';
      expect(() => {
        render(
          withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
        );
      }).not.toThrow();

      // Should still replace the valid variable
      expect(screen.getByText(/test-collective/)).toBeInTheDocument();
    });

    it('does not crash on empty braces', () => {
      const instructions = 'Text with {} and {collective}';
      expect(() => {
        render(
          withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
        );
      }).not.toThrow();

      // Should still replace the valid variable
      expect(screen.getByText(/test-collective/)).toBeInTheDocument();
    });

    it('formats currency amounts correctly', () => {
      const instructions = 'Amount: {amount}, Reference: {reference}';
      const valuesWithLargeAmount = {
        ...defaultValues,
        amount: { valueInCents: 123456, currency: Currency.USD },
      };

      render(
        withRequiredProviders(
          <CustomPaymentMethodInstructions instructions={instructions} values={valuesWithLargeAmount} />,
        ),
      );

      expect(screen.getByText(/Amount: \$1,234\.56/)).toBeInTheDocument();
      expect(screen.getByText(/Reference: 789/)).toBeInTheDocument();
    });

    it('handles list formatting with variables', () => {
      const instructions = '<ul><li>Send {amount}</li><li>For {collective}</li></ul>';
      render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
      );

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('list-disc');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
      expect(listItems[0]).toHaveTextContent('Send $100.00');
      expect(listItems[1]).toHaveTextContent('For test-collective');
    });

    it('handles multiple occurrences of the same variable', () => {
      const instructions = '{collective} is the collective. Donate to {collective}.';
      const { container } = render(
        withRequiredProviders(<CustomPaymentMethodInstructions instructions={instructions} values={defaultValues} />),
      );

      // Verify the text content contains the replaced value multiple times
      const textContent = container.textContent || '';
      const matches = textContent.match(/test-collective/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(2);

      // Verify the full text is rendered correctly
      expect(screen.getByText(/test-collective is the collective/)).toBeInTheDocument();
      expect(screen.getByText(/Donate to test-collective/)).toBeInTheDocument();
    });
  });
});
