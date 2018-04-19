import React from 'react';
import ReactDOM from 'react-dom';
import TicketController from '../TicketController';

let ticketCtlr;


describe("TicketController", () => {

  const div = document.createElement('div');

  it('decreases the value by 1', () => {
    const onChange = (value) => {
      console.log("> onChange", value);
      expect(value).toEqual(1);
    }
    ticketCtlr = ReactDOM.render(<TicketController value={2} onChange={onChange} />, div);
    ticketCtlr.changeValue(-1);
  });

  it('increases the value by 1', () => {
    const onChange = (value) => {
      console.log("> onChange", value);
      expect(value).toEqual(3);
    }
    ticketCtlr = ReactDOM.render(<TicketController value={2} onChange={onChange} />, div);
    ticketCtlr.changeValue(1);
  });

  it('doesn\'t go below 1', () => {
    const onChange = (value) => {
      console.log("> onChange", value);
      expect(value).toEqual(1);
    }
    ticketCtlr = ReactDOM.render(<TicketController value={1} onChange={onChange} />, div);
    ticketCtlr.changeValue(-1);
  });

})
