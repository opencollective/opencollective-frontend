import React from 'react';
import { shallow } from 'enzyme';

import App from '../pages/button.js';

describe('Donate Button', () => {
  it('Button links to /:collectiveSlug/donate"', () => {
    const app = shallow(<App collectiveSlug="webpack" />);
    expect(app.find({ href: 'https://opencollective.com/webpack/donate' }).length).toEqual(1);
  });
});
