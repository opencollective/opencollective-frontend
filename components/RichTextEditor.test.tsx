import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../test/providers';

import RichTextEditor from './RichTextEditor';

jest.mock('trix', () => ({
  default: {
    config: {
      blockAttributes: {},
      attachments: { preview: { caption: {} } },
      dompurify: { ADD_TAGS: [], ADD_ATTR: [] },
    },
    HTMLSanitizer: { setHTML: jest.fn() },
    Attachment: jest.fn(data => data),
  },
}));

describe('RichTextEditor', () => {
  const defaultProps = {
    id: 'rich-text-editor-test',
    version: 'default' as const,
    kind: 'UPDATE',
  };

  const renderEditor = (props: Record<string, unknown> = {}) => {
    const ref = createRef<RichTextEditor>();
    const view = render(withRequiredProviders(<RichTextEditor ref={ref} {...defaultProps} {...props} />));
    return { ref, ...view };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the trix editor and hidden input', () => {
      renderEditor();

      expect(document.querySelector('trix-editor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('parseServiceLink', () => {
    it('parses youtube watch URLs', () => {
      const { ref } = renderEditor();

      expect(ref.current.parseServiceLink('https://www.youtube.com/watch?v=G2IWYXxO324')).toEqual({
        service: 'youtube',
        id: 'G2IWYXxO324',
      });
    });

    it('parses youtu.be URLs', () => {
      const { ref } = renderEditor();

      expect(ref.current.parseServiceLink('https://youtu.be/G2IWYXxO324')).toEqual({
        service: 'youtube',
        id: 'G2IWYXxO324',
      });
    });

    it('returns empty object for unsupported URLs', () => {
      const { ref } = renderEditor();

      expect(ref.current.parseServiceLink('https://example.com/video')).toEqual({});
    });
  });

  describe('constructVideoEmbedURL', () => {
    it('builds a privacy-enhanced youtube embed URL', () => {
      const { ref } = renderEditor();

      expect(ref.current.constructVideoEmbedURL('youtube', 'G2IWYXxO324')).toBe(
        'https://www.youtube-nocookie.com/embed/G2IWYXxO324',
      );
    });

    it('returns null for unsupported services', () => {
      const { ref } = renderEditor();

      expect(ref.current.constructVideoEmbedURL('vimeo', '123456')).toBeNull();
    });
  });

  describe('embedIframe', () => {
    it('inserts a youtube iframe with referrer policy for YouTube error 153', () => {
      const { ref } = renderEditor();
      const insertAttachment = jest.fn();
      jest.spyOn(ref.current, 'getEditor').mockReturnValue({ insertAttachment });

      ref.current.embedIframe('https://www.youtube.com/watch?v=G2IWYXxO324');

      expect(insertAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: '--embed-iframe-video',
          content: expect.stringContaining('referrerpolicy="strict-origin-when-cross-origin"'),
        }),
      );
      expect(insertAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('https://www.youtube-nocookie.com/embed/G2IWYXxO324?showinfo=0'),
        }),
      );
    });

    it('does not add referrer policy for anchor.fm embeds', () => {
      const { ref } = renderEditor();
      const insertAttachment = jest.fn();
      jest.spyOn(ref.current, 'getEditor').mockReturnValue({ insertAttachment });

      ref.current.embedIframe('https://anchor.fm/my-podcast/embed/episodes/my-episode-e123abc');

      expect(insertAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: '--embed-iframe-anchorFm',
          content:
            '<iframe src="https://anchor.fm/my-podcast/embed/episodes/my-episode-e123abc" width="100%" frameborder="0"/>',
        }),
      );
      expect(insertAttachment.mock.calls[0][0].content).not.toContain('referrerpolicy');
    });
  });

  describe('prepareHTML', () => {
    it('preserves referrerpolicy when rebuilding trix attachments for video figures', () => {
      const html = `
        <figure data-trix-content-type="--embed-iframe-video">
          <iframe src="https://www.youtube-nocookie.com/embed/G2IWYXxO324?showinfo=0" width="100%" height="394" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </figure>
      `;

      renderEditor({ defaultValue: html });

      const hiddenInput = document.querySelector('input[type="hidden"][name="content"]') as HTMLInputElement;
      const attachment = JSON.parse(
        new DOMParser()
          .parseFromString(hiddenInput.value, 'text/html')
          .querySelector('figure')
          .getAttribute('data-trix-attachment'),
      );

      expect(attachment.contentType).toBe('--embed-iframe-video');
      expect(attachment.content).toContain('referrerpolicy="strict-origin-when-cross-origin"');
      expect(attachment.content).toContain('youtube-nocookie.com/embed/G2IWYXxO324');
    });
  });

  describe('trixBeforeInitialize', () => {
    it('allows referrerpolicy through Trix sanitization', () => {
      renderEditor();

      document.dispatchEvent(new Event('trix-before-initialize'));

      const Trix = require('trix').default; // eslint-disable-line @typescript-eslint/no-require-imports
      expect(Trix.config.dompurify.ADD_ATTR).toContain('referrerpolicy');
    });
  });
});
