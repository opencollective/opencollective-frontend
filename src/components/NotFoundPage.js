import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import NotFound from './NotFound';

export default () => {
  return (
    <div className="NotFoundPage">
      <Header />
      <Body>
        <NotFound />
      </Body>
      <Footer />
    </div>
  )
}