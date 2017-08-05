
import { mount } from 'enzyme';
import React from 'react';
import EditEventForm from '../EditEventForm';

import eventData from '../../../test/mocks/Event.json';
const event = eventData.data.Collective;

import { IntlProvider, addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
addLocaleData([...en]);

describe("EditEventForm component", () => {

  const onSubmit = (form) => {
    expect(form.id).toEqual(event.id);
    expect(form.tiers.length).toEqual(event.tiers.length - 2);
  }

  const component = mount(
    <IntlProvider locale="en">
      <EditEventForm
          event={event}
          onSubmit={onSubmit}
        />
      </IntlProvider>
  );

  it('show input type text with slug prefilled', () => {
    component.find('a.removeTier').first().simulate('click');
    component.find('a.removeTier').first().simulate('click');
    component.find('.actions Button').simulate('click');
    // console.log("labels", component.find('label').map(node => node.text()));
    expect(component.find('label').first().text()).toEqual('Url');
    expect(component.find('input[name="slug"]').exists()).toBeTrue;
    expect(component.find('input[name="slug"]').prop("value")).toEqual(event.slug.replace(/.*\//,''));
  });
});
