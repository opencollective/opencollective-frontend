import Header from './Header';
import Body from './Body';
import Footer from './Footer';

export default ({message}) => {
  return (
    <div className="Error">
      <Header />
      <style jsx>{`
      h1 {
        text-align:center;
        padding: 8rem;
      }
      `}
      </style>
      <Body>
        <h1>{message || "unknown error"}</h1>
      </Body>
      <Footer />
    </div>
  )
}