import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import NotFound from './NotFound';

const NotFoundPage = () => {
  return (
    <div className="NotFoundPage">
      <Header />
      <Body>
        <NotFound />
      </Body>
      <Footer />
    </div>
  )
};

export default NotFoundPage;
