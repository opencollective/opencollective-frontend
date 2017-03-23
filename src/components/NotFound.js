import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';

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
      <Header />
      <Body>
        <h1>Event Not Found</h1>
        <div className="shrug">¯\_(ツ)_/¯ </div>
      </Body>
      <Footer />
    </div>
  )
}