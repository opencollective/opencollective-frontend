import fs from 'fs';
import path from 'path';

import { isEmpty, isPlainObject, mapValues, pickBy, template } from 'lodash-es';
import { z } from 'zod';

const WIDGET_ALLOWLIST = /^(widget|events|collectives|banner)$/;
const SAFE_SELECTOR_REGEX = /^[a-zA-Z0-9#_.-]{1,50}$/;
const SAFE_PROPERTY_REGEX = /^[a-zA-Z-]{1,50}$/;
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isSafeKey = (key, regex) => !DANGEROUS_KEYS.has(key) && regex.test(key);

const safeCssValue = z.union([
  z
    .string()
    .max(300)
    .regex(/^[a-zA-Z0-9#(),. %_+-]+$/),
  z.number().finite(),
]);

const styleSchema = z.record(z.string(), z.any()).transform(raw =>
  pickBy(
    mapValues(
      pickBy(raw, (props, selector) => isSafeKey(selector, SAFE_SELECTOR_REGEX) && isPlainObject(props)),
      props =>
        pickBy(props, (val, prop) => isSafeKey(prop, SAFE_PROPERTY_REGEX) && safeCssValue.safeParse(val).success),
    ),
    props => !isEmpty(props),
  ),
);

function sanitizeStyle(raw) {
  if (typeof raw !== 'string') {
    return '{}';
  }
  try {
    const parsed = JSON.parse(raw);
    const parsedResult = styleSchema.safeParse(parsed);
    if (!parsedResult.success) {
      return '{}';
    }
    return JSON.stringify(parsedResult.data);
  } catch {
    return '{}';
  }
}

// next.js export
// ts-unused-exports:disable-next-line
export default function handler(req, res) {
  const content = fs.readFileSync(path.join(process.cwd(), 'server/templates/widget.js'), 'utf8');
  const compiled = template(content, { interpolate: /{{([\s\S]+?)}}/g });

  const widget =
    typeof req.query?.widget === 'string' && WIDGET_ALLOWLIST.test(req.query.widget) ? req.query.widget : 'banner';
  const style = sanitizeStyle(req.query?.style);

  res.set('Cache-Control', `public, max-age=86400`);
  res.setHeader('content-type', 'application/javascript');
  res.send(
    compiled({
      style,
      widget,
      host: process.env.WEBSITE_URL,
    }),
  );
}
