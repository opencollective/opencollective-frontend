import { mount } from 'enzyme';
import React from 'react';
import EditEventForm from '../EditEventForm';
import { ThemeProvider } from 'styled-components';
import theme from '../../lib/theme';

import eventData from '../../test/mocks/Event.json';
const event = eventData.data.Collective;

import { IntlProvider } from 'react-intl';

describe('EditEventForm component', () => {
  const onSubmit = form => {
    expect(form.id).toEqual(event.id);
    expect(form.tiers.length).toEqual(event.tiers.length - 2);
  };

  const component = mount(
    <IntlProvider locale="en">
      <ThemeProvider theme={theme}>
        <EditEventForm event={event} onSubmit={onSubmit} />
      </ThemeProvider>
    </IntlProvider>,
  );

  // @TODO: update: no need for slug anymore
  it.skip('show input type text with slug prefilled', () => {
    component.find('a.removeTier').first().simulate('click');
    component.find('a.removeTier').first().simulate('click');
    component.find('.actions Button').simulate('click');
    expect(component.find('label').first().text()).toEqual('Name');
    expect(component.find('input[name="slug"]').exists()).toBeTrue;
    expect(component.find('input[name="slug"]').prop('value')).toEqual(event.slug.replace(/.*\//, ''));
  });
});
