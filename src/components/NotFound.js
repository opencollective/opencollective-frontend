import React from 'react';

export default () => {
  return (
    <div className="NotFound">
      <style jsx>{`
      .NotFound .logo {
        position: absolute;
        bottom: 10px;
        text-align: center;
        width: 100%;
      }
      .NotFound .logo img {
        width: 90%;
        max-width: 200px;
      }
      .NotFound .shrug {
        font-size: 3.6rem;
        text-align: center;
        color: #46B0ED;
      }
      `}
      </style>
      <h1>Event Not Found</h1>
      <div className="shrug">¯\_(ツ)_/¯ </div>
      <div className="logo"><img src="/static/images/opencollectivelogo.svg" /></div>
    </div>
  )
}