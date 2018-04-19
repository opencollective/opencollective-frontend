import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import markdown from '../markdown/tos.md';

export default () =>
  (<div className="root">
    <Header title="Terms of Service" />
    <Body>
      <div className="content" dangerouslySetInnerHTML={{__html: markdown}} />
    </Body>
    <Footer />
  </div>)
