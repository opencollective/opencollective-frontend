import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import markdown from '../markdown/widgets.md';

const WidgetsPage = () =>
  (<div className="root">
    <Header title="Widgets" />
    <Body>
      <div className="content" dangerouslySetInnerHTML={{__html: markdown}} />
    </Body>
    <Footer />
  </div>);

export default WidgetsPage;
