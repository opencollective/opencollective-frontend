import React from 'react';

import Button from '../pages/button.js';

import { snapshot } from './snapshot-helpers.js';

describe('Donate Button', () => {
  it('Button links to /:collectiveSlug/donate"', () => {
    snapshot(<Button collectiveSlug="webpack" />);
  });
});
