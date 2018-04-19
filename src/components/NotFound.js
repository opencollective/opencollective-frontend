import React from 'react';

export default () => {
  return (
    <div className="NotFound">
      <style jsx>{`
      h1 {
        text-align: center;
      }
      .shrug {
        font-size: 3.6rem;
        text-align: center;
        color: #46B0ED;
      }
      `}
      </style>
      <h1>Not Found</h1>
      <div className="shrug">¯\_(ツ)_/¯ </div>
    </div>
  )
}
