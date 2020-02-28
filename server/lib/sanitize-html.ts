import LibSanitize from 'sanitize-html';
import { truncate } from 'lodash';

interface AllowedContentType {
  /** Allows titles  supported by RichTextEditor (`h3` only) */
  titles?: boolean;
  /** Includes bold, italic, strong and strike */
  basicTextFormatting?: boolean;
  /** Includes multiline rich text formatting like lists or code blocks */
  multilineTextFormatting?: boolean;
  /** Allow <a href="..."/> */
  links?: boolean;
  /** Allow images */
  images?: boolean;
  /** Allow video iframes from trusted providers */
  videoIframes?: boolean;
  /** Allow tables */
  tables?: boolean;
}

interface SanitizeOptions {
  allowedTags: string[];
  allowedAttributes: Record<string, any>;
  allowedIframeHostnames: string[];
  transformTags: any;
}

export const buildSanitizerOptions = (allowedContent: AllowedContentType = {}): SanitizeOptions => {
  // Nothing allowed by default
  const allowedTags = [];
  const allowedAttributes = {};
  const allowedIframeHostnames = [];

  // Titles
  if (allowedContent.titles) {
    allowedTags.push('h3');
  }

  // Multiline text formatting
  if (allowedContent.basicTextFormatting) {
    allowedTags.push('b', 'i', 'strong', 'em', 'strike', 'del');
  }

  // Basic text formatting
  if (allowedContent.multilineTextFormatting) {
    allowedTags.push('p', 'ul', 'ol', 'nl', 'li', 'blockquote', 'code', 'pre', 'br', 'div');
  }

  // Images
  if (allowedContent.images) {
    allowedTags.push('img', 'figure', 'figcaption');
    allowedAttributes['img'] = ['src'];
  }

  // Links
  if (allowedContent.links) {
    allowedTags.push('a');
    allowedAttributes['a'] = ['href', 'name', 'target'];
  }

  // Tables
  if (allowedContent.tables) {
    allowedTags.push('table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td');
  }

  // IFrames
  if (allowedContent.videoIframes) {
    allowedTags.push('iframe');
    allowedIframeHostnames.push('www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com');
    allowedAttributes['iframe'] = [
      'src',
      'allowfullscreen',
      'frameborder',
      'autoplay',
      'width',
      'height',
      {
        name: 'allow',
        multiple: true,
        values: ['autoplay', 'encrypted-media', 'gyroscope'],
      },
    ];
  }

  return {
    allowedTags,
    allowedAttributes,
    allowedIframeHostnames,
    transformTags: {
      h1: 'h3',
      h2: 'h3',
    },
  };
};

/** Default options to strip everything */
const optsStripAll = buildSanitizerOptions();
const optsSanitizeSummary = buildSanitizerOptions({ links: true, basicTextFormatting: true });

/**
 * Sanitize the given input to strip the HTML content.
 *
 * This function is a specialization of the one provided by `sanitize-html` with
 * smart defaults to match our use cases. It works as a whitelist, so by default all
 * tags will be stripped out.
 */
export function sanitizeHTML(content, options: SanitizeOptions = optsStripAll) {
  return LibSanitize(content, options);
}

/**
 * Will remove all HTML content from the string.
 */
export const stripHTML = content => sanitizeHTML(content, optsStripAll);

/**
 * An helper to generate a summary for an HTML content. A summary is defined as a single
 * line content truncated to a max length, with tags like code blocks removed. It still
 * allows the use of bold, italic and other single-line format options.
 */
export const generateSummaryForHTML = (content, maxLength = 255) => {
  if (!content) {
    return null;
  }

  // Replace all new lines by separators
  const withoutBR = content.replace(/<br\/?>/, ' ');
  const separatedTitles = withoutBR.replace(/<\/h3>/, '</h3> · ');

  // Sanitize: `<li><strong> Test with   spaces </strong></li>` ==> `<strong> Test with   spaces </strong>`
  const sanitized = sanitizeHTML(separatedTitles, optsSanitizeSummary);

  // Trim: `<strong> Test with   spaces </strong>` ==> <strong>Test with spaces</strong>
  const trimmed = sanitized
    .trim()
    .replace('\n', ' ')
    .replace(/\s+/g, ' ');

  // Truncate
  const truncated = truncate(trimmed, { length: maxLength });

  // Second sanitize pass: an additional precaution in case someones finds a way to play with the trimmed version
  return sanitizeHTML(truncated, optsSanitizeSummary);
};
