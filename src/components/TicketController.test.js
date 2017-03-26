import React from 'react';
import ReactDOM from 'react-dom';
import TicketController from './TicketController';

let ticketCtlr;

const onChange = (value) => {
  console.log("> onChange", value);
}

describe("TicketController", () => {

  const div = document.createElement('div');
  ticketCtlr = ReactDOM.render(<TicketController value={2} onChange={onChange} />, div);

  it('decreases the value by 1', () => {
    ticketCtlr.changeValue(-1);
    expect(ticketCtlr.state.value).toEqual(1);
    expect(div.textContent).toEqual('-1 ticket+');
  });

  it('increases the value by 1', () => {
    ticketCtlr.changeValue(1);
    expect(ticketCtlr.state.value).toEqual(2);
    expect(div.textContent).toEqual('-2 tickets+');
  });

})
