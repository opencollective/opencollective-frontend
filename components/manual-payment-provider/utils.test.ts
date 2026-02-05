import { formatAccountDetails } from './utils';

describe('formatAccountDetails', () => {
  describe('legacy behavior (asSafeHTML = false)', () => {
    it('returns empty string for null/undefined input', () => {
      expect(formatAccountDetails(null)).toBe('');
      expect(formatAccountDetails(undefined)).toBe('');
    });

    it('formats simple key-value pairs with newlines', () => {
      const data = { accountNumber: '12345', bankName: 'Test Bank' };
      const result = formatAccountDetails(data);
      expect(result).toContain('Account Number: 12345');
      expect(result).toContain('Bank Name: Test Bank');
      expect(result).toContain('\n');
    });

    it('ignores specified keys (type, isManualBankTransfer, currency)', () => {
      const data = { type: 'bank', isManualBankTransfer: true, currency: 'USD', accountNumber: '12345' };
      const result = formatAccountDetails(data);
      expect(result).toBe('Account Number: 12345');
    });

    it('uses custom label for abartn', () => {
      const data = { abartn: '123456789' };
      const result = formatAccountDetails(data);
      expect(result).toBe('Routing Number: 123456789');
    });

    it('uses empty label for firstLine', () => {
      const data = { firstLine: '123 Main St' };
      const result = formatAccountDetails(data);
      expect(result).toBe('123 Main St');
    });

    it('preserves uppercase keys as-is', () => {
      const data = { IBAN: 'DE89370400440532013000' };
      const result = formatAccountDetails(data);
      expect(result).toBe('IBAN: DE89370400440532013000');
    });

    it('handles nested objects with indentation', () => {
      const data = { accountNumber: '12345', address: { city: 'NYC', country: 'USA' } };
      const result = formatAccountDetails(data);
      expect(result).toContain('Account Number: 12345');
      expect(result).toContain('Address:');
      expect(result).toContain('  City: NYC');
      expect(result).toContain('  Country: USA');
    });

    it('flattens details object without key label', () => {
      const data = { details: { accountNumber: '12345', bankName: 'Test Bank' } };
      const result = formatAccountDetails(data);
      expect(result).toContain('Account Number: 12345');
      expect(result).toContain('Bank Name: Test Bank');
      expect(result).not.toContain('Details');
    });

    it('does not escape HTML characters', () => {
      const data = { notes: '<script>alert("xss")</script>' };
      const result = formatAccountDetails(data);
      expect(result).toBe('Notes: <script>alert("xss")</script>');
    });
  });

  describe('with asSafeHTML = true', () => {
    it('uses <br /> as separator', () => {
      const data = { accountNumber: '12345', bankName: 'Test Bank' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toContain('<br />');
      expect(result).not.toContain('\n');
    });

    it('wraps top-level keys in <strong> tags', () => {
      const data = { accountNumber: '12345' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toBe('<strong>Account Number: </strong>12345');
    });

    it('wraps top-level keys with custom labels in <strong> tags', () => {
      const data = { abartn: '123456789' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toBe('<strong>Routing Number: </strong>123456789');
    });

    it('handles firstLine with empty label correctly', () => {
      const data = { firstLine: '123 Main St' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toBe('<strong></strong>123 Main St');
    });

    it('wraps uppercase keys in <strong> tags', () => {
      const data = { IBAN: 'DE89370400440532013000' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toBe('<strong>IBAN: </strong>DE89370400440532013000');
    });

    it('only wraps top-level keys in <strong>, not nested keys', () => {
      const data = { address: { city: 'NYC', country: 'USA' } };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toContain('<strong>Address: </strong>');
      expect(result).toContain('  City: NYC');
      expect(result).toContain('  Country: USA');
      expect(result).not.toContain('<strong>City:');
      expect(result).not.toContain('<strong>  City:');
    });

    it('escapes HTML characters in values', () => {
      const data = { notes: '<script>alert("xss")</script>' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toBe('<strong>Notes: </strong>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('escapes HTML characters in uppercase keys', () => {
      // Uppercase keys are preserved as-is (not transformed by startCase), so special chars are escaped
      const data = { 'IBAN<>': 'value' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toBe('<strong>IBAN&lt;&gt;: </strong>value');
    });

    it('escapes values with special characters', () => {
      const data = { notes: 'value<>&"' };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toBe('<strong>Notes: </strong>value&lt;&gt;&amp;&quot;');
    });

    it('escapes nested values but not nested keys with <strong> tags', () => {
      const data = { address: { city: '<NYC>' } };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toContain('<strong>Address: </strong>');
      expect(result).toContain('  City: &lt;NYC&gt;');
    });

    it('handles flattened details object with strong tags on keys', () => {
      const data = { details: { accountNumber: '12345', bankName: '<Test>' } };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      expect(result).toContain('<strong>Account Number: </strong>12345');
      expect(result).toContain('<strong>Bank Name: </strong>&lt;Test&gt;');
      expect(result).not.toContain('Details');
    });

    it('handles nested structure with escaped values', () => {
      const data = {
        IBAN: 'DE89<>',
        holder: { name: 'John & Jane' },
      };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      // Top-level IBAN key with escaped value
      expect(result).toContain('<strong>IBAN: </strong>DE89&lt;&gt;');
      // Top-level holder key
      expect(result).toContain('<strong>Holder: </strong>');
      // Nested name (not wrapped in strong, but value escaped)
      expect(result).toContain('  Name: John &amp; Jane');
    });

    it('handles deeply nested structure correctly', () => {
      const data = {
        holder: { address: { city: '"NYC"' } },
      };
      const result = formatAccountDetails(data, { asSafeHTML: true });
      // Top-level holder key
      expect(result).toContain('<strong>Holder: </strong>');
      // Nested address key (not wrapped in strong, and no prefix for object keys)
      expect(result).toContain('Address:');
      // Deeply nested city value escaped (with indentation from the nested prefix)
      expect(result).toContain('  City: &quot;NYC&quot;');
    });
  });
});
