import Link from 'next/prefetch'
import React from 'react';

class Footer extends React.Component {

  componentDidMount() {
    const svg = this.refs.svg.getSVGDocument();
    svg.querySelector('#logotype').style.fill = '#7a7b82';
  }

  render() {
    return (
      <div className="Footer">
        <style jsx>{`
        .Footer {
          background-color: #303233;
          margin-top: 2rem;
          padding: 0rem 1rem;
          overflow: hidden;
        }
        .container {
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-around;
          justify-content: 
          max-width: 1070px;
          margin: 0 auto;
        }
        .logo {
          padding-top: 0.8rem;
        }
        ul {
          list-style: none;
          margin: 0;
          white-space: pre;
          padding-left: 0;
        }
        li {
          display: inline-block;
        }
        li a {
          opacity: 0.5;
          color: white;
          font-size: 1.2rem;
          font-family: Montserrat,sans-serif;
          text-decoration: none;
          padding: 1rem;
          display: block;
        }
        :global(svg #logotype) {
          fill: red;
        }
        `}</style>
        <div className="container">
          <div className="left">
            <object ref="svg" type="image/svg+xml" data="/static/images/opencollectivelogo.svg" height='20' className="logo"></object>
          </div>
          <div className="right">
            <nav>
              <ul>
                <li><a href="/learn-more">How It Works</a></li>
                <li><a href="https://opencollective.com/#opensource">Use Cases</a></li>
                <li><a href="https://opencollective.com/faq">FAQ</a></li>
                <li><Link href="/tos"><a>Terms Of Service</a></Link></li>
                <li><a href="https://opencollective.com/about">About</a></li>
                <li><a href="mailto:info@opencollective.com">Contact</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;

