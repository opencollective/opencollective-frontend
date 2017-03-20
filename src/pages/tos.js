import Header from '../components/Header';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';
import markdown from '../markdown/tos.md';

export default () =>
  <div className="root">
    <Header />
    <TopBar />
    <div className="content" dangerouslySetInnerHTML={{__html: markdown}} />
    <Footer />
  </div>