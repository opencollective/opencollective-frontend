import sanitizeHtml from 'sanitize-html';

export const stripHTML = htmlContent => sanitizeHtml(htmlContent, { allowedTags: [], allowedAttributes: {} });
