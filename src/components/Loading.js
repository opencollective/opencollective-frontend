import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';

export default () => {
  return (
    <div className="loading">
      <Header />
      <style jsx>{`
      h1 {
        text-align:center;
        padding: 8rem;
      }
      `}
      </style>
      <Body>
        <h1>Loading</h1>
      </Body>
      <Footer />
    </div>
  )
}