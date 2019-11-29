import React from 'react';
import ReactDOM from 'react-dom';
import TicketController from '../TicketController';

const DEBUG = process.env.DEBUG || false;

describe('TicketController', () => {
  const div = document.createElement('div');

  it('decreases the value by 1', () => {
    const onChange = value => {
      if (DEBUG) console.log('> onChange', value);
      expect(value).toEqual(1);
    };
    ReactDOM.render(
      <TicketController ref={ticketCtlr => ticketCtlr.changeValue(-1)} value={2} onChange={onChange} />,
      div,
    );
  });

  it('increases the value by 1', () => {
    const onChange = value => {
      if (DEBUG) console.log('> onChange', value);
      expect(value).toEqual(3);
    };
    ReactDOM.render(
      <TicketController ref={ticketCtlr => ticketCtlr.changeValue(1)} value={2} onChange={onChange} />,
      div,
    );
  });

  it("doesn't go below 1", () => {
    const onChange = value => {
      if (DEBUG) console.log('> onChange', value);
      expect(value).toEqual(1);
    };
    ReactDOM.render(
      <TicketController ref={ticketCtlr => ticketCtlr.changeValue(-1)} value={1} onChange={onChange} />,
      div,
    );
  });
});
