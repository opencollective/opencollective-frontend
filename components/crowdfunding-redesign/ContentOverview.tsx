import React, { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import sanitizeHtml from 'sanitize-html';

import { triggerPrototypeToast } from './helpers';

export const ContentOverview = ({ content }) => {
  const [headings, setHeadings] = useState<string[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h3');
    const headingTexts = Array.from(headingElements).map(h3 => h3.textContent?.trim() || '');
    setHeadings(headingTexts);
  }, [content]);

  const linkClasses = cva('block border-l-[3px] px-2 text-sm font-semibold hover:text-primary', {
    variants: {
      active: {
        true: 'border-primary/80',
        false: 'border-transparent',
      },
    },
    defaultVariants: {
      active: false,
    },
  });

  return (
    <div className="space-y-4">
      <Link href="#" className={linkClasses({ active: true })} onClick={triggerPrototypeToast}>
        About
      </Link>
      {headings.map(heading => {
        const sanitizedKey = sanitizeHtml(heading, {
          allowedTags: [], // No tags allowed
          allowedAttributes: {}, // No attributes allowed
        }).replace(/[^a-zA-Z0-9-_]/g, '_'); // Replace unsafe characters

        return (
          <Link
            href="#"
            key={sanitizedKey} // Use sanitized and unique key
            className={linkClasses()}
            onClick={triggerPrototypeToast}
          >
            {heading}
          </Link>
        );
      })}
    </div>
  );
};
