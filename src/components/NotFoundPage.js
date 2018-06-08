import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import NotFound from './NotFound';
import { FormattedMessage } from 'react-intl';

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
        <p align="center"><FormattedMessage id="notFound.search" defaultMessage="Let me try to find {term} for you..." values={{ term: slug }} /></p>
        }
      </Body>
      <Footer />
    </div>
  )
};

export default NotFoundPage;
