import React from 'react';
import logo from '../images/opencollectivelogo.svg';
import '../css/NotFound.css';

export default () => {
  return (
    <div>
      <h1>Event Not Found</h1>
      <div className="shrug">¯\_(ツ)_/¯ </div>
      <div className="logo"><img src={logo} /></div>
    </div>
  )
}