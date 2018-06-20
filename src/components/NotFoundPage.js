import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import NotFound from './NotFound';
import Button from './Button';
import { FormattedMessage } from 'react-intl';

const NotFoundPage = ({ slug }) => {
  return (
    <div className="NotFoundPage">
      <style jsx>{`
        p {
          margin: 4rem 0;
          text-align: center;
        }
      `}</style>
      <Header />
      <Body>
        <NotFound />
        { slug &&
        <p>
          <Button href={`/search?q=${slug}`} className="blue">
            <FormattedMessage id="notFound.search" defaultMessage="search for {term} " values={{ term: slug }} />
          </Button>
        </p>
        }
      </Body>
      <Footer />
    </div>
  )
};

export default NotFoundPage;
