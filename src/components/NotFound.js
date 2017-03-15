import React from 'react';
import '../styles/NotFound.css';

export default () => {
  return (
    <div className="NotFound">
      <h1>Event Not Found</h1>
      <div className="shrug">¯\_(ツ)_/¯ </div>
      <div className="logo"><img src="/static/images/opencollectivelogo.svg" /></div>
    </div>
  )
}