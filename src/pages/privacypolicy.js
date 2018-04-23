import markdown from '../markdown/privacypolicy.md';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

export default () =>
  (<div className="root">
    <style jsx global>{`
      th {
        min-width: 200px;
        text-align: left;
        vertical-align: top;
        padding-top: 1rem;
      }
      h4 {
        margin-top: 1rem;
      }
      ul {

      }
      li {
        margin: 0.5rem;
      }
    `}</style>
    <Header title="Privacy Policy" />
    <Body>
      <div className="content" dangerouslySetInnerHTML={{__html: markdown}} />
    </Body>
    <Footer />
  </div>)
