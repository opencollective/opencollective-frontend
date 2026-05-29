/**
 * Load data-URL images so the QR SVG can be rasterized and decoded with jsQR.
 * @jest-environment-options {"resources": "usable"}
 */
import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import jsQR from 'jsqr';

import { Currency } from '@/lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../test/providers';

import { CustomPaymentMethodInstructions } from './CustomPaymentMethodInstructions';

/** Rasterizes the rendered QR SVG and decodes its payload with jsQR (validates pixels match the encoded string). */
async function decodeQrPayloadFromSvg(svg: SVGSVGElement): Promise<string> {
  let serialized = new XMLSerializer().serializeToString(svg);
  if (!serialized.includes('xmlns=')) {
    serialized = serialized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const scale = 4;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      if (!result?.data) {
        reject(new Error('jsQR could not read QR from rendered SVG'));
        return;
      }
      resolve(result.data);
    };
    img.onerror = () => reject(new Error('Failed to load QR SVG as image'));
    img.src = dataUrl;
  });
}

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

    it('renders EPC QR section with title, Wikipedia link, and QR for EUR + IBAN', async () => {
      const eurValues = {
        amount: { valueInCents: 2420, currency: Currency.EUR },
        collectiveSlug: 'test-collective',
        OrderId: 51431,
        accountDetails: {
          accountHolderName: 'A Valid Collective',
          details: {
            IBAN: 'BE69967102423878',
            BIC: 'TRWIBEB1XXX',
          },
        },
      };
      const { container } = render(
        withRequiredProviders(
          <CustomPaymentMethodInstructions instructions="Please pay {amount}." values={eurValues} />,
        ),
      );
      expect(screen.getByText(/Scan to pay/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /This QR code carries the data for a SEPA credit transfer\. Many banking apps in Europe let you scan it to fill in the payee, amount, and reference\./,
        ),
      ).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /Learn more about EPC QR/i });
      expect(link).toHaveAttribute('href', 'https://wikipedia.org/wiki/EPC_QR_code');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      const qrSvg = container.querySelector('[data-cy="qr-code"]');
      expect(qrSvg).toBeInTheDocument();
      expect(qrSvg?.tagName.toLowerCase()).toBe('svg');
      const decoded = await decodeQrPayloadFromSvg(qrSvg as SVGSVGElement);
      // EPC QR payload for the values above (service tag BCD, SEPA credit transfer, EUR 24.20, ref 51431).
      const expectedEpcQrPayload = [
        'BCD',
        '002',
        '1',
        'SCT',
        'TRWIBEB1XXX',
        'A Valid Collective',
        'BE69967102423878',
        'EUR24.20',
        '',
        '',
        '51431',
        '',
      ].join('\n');
      expect(decoded).toBe(expectedEpcQrPayload);
    });
  });
});
