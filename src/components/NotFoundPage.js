import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import NotFound from './NotFound';

const NotFoundPage = ({ slug }) => {
  return (
    <div className="NotFoundPage">
      <style jsx>{`
        p {
          margin: 4rem 0;
        }
      `}</style>
      <Header />
      <Body>
        <NotFound />
        { slug &&
        <p align="center">Let me try to find {slug} for you...</p>
        }
      </Body>
      <Footer />
    </div>
  )
};

export default NotFoundPage;
