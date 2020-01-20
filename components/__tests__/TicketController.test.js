import React from 'react';
import { mount } from 'enzyme';

import TicketController from '../TicketController';

const DEBUG = process.env.DEBUG || false;

describe('TicketController', () => {
  it('decreases the value by 1', () => {
    const onChange = value => {
      if (DEBUG) console.log('> onChange', value);
      expect(value).toEqual(1);
    };
    const changeValue = ticketCtlr => ticketCtlr.changeValue(-1);
    mount(<TicketController value={2} onChange={onChange} ref={changeValue} />);
  });

  it('increases the value by 1', () => {
    const onChange = value => {
      if (DEBUG) console.log('> onChange', value);
      expect(value).toEqual(3);
    };
    const changeValue = ticketCtlr => ticketCtlr.changeValue(1);
    mount(<TicketController value={2} onChange={onChange} ref={changeValue} />);
  });

  it("doesn't go below 1", () => {
    const onChange = value => {
      if (DEBUG) console.log('> onChange', value);
      expect(value).toEqual(1);
    };
    const changeValue = ticketCtlr => ticketCtlr.changeValue(-1);
    mount(<TicketController value={1} onChange={onChange} ref={changeValue} />);
  });
});
