import React from 'react';

export default class Body extends React.Component {

  render() {
    return (
      <main>
        <style jsx global>{`
        main {
          height: 100%;
          width: 100%;
          font-family: lato, montserratlight, Helvetica,sans-serif;
          font-weight: 300;
          font-size: 1.6rem;
          line-height: 1.5;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }

        a {
          text-decoration: none !important;
          cursor: pointer;
        }
        button {
          cursor: pointer;
        }

        section h1 {
          font-size: 1.8rem;
        }

        section h2 {
          font-size: 1.6rem;
        }

        .content {
          max-width: 1244px;
          padding: 2rem 3rem;
          margin: 0 auto;
          line-height: 1.5;
          overflow: hidden;
        }

        .content p {
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 1.5rem 0;
        }

        .content h2 {
          font-size: 1.8rem;
        }

        .content h3 {
          font-size: 1.7rem;
        }

        .content > ul {
          padding-left: 3rem;
        }

        .content ul p {
          display: initial;
        }

        .content li {
          margin: 1rem 0;
          text-align: left;
        }

        .content img {
          max-width: 100%;
        }

        .content code {
          background-color: #f6f8fa;
          padding: 0.5rem;
          overflow: scroll;
          max-width: 100%;
        }

        .content code:first-child:last-child {
          display: inline-block;
          padding: 1rem;
        }

        @media(max-width: 420px) {
          .content {
            padding: 1rem 1.5rem;
          }
        }
        `}</style>
        {this.props.children}
      </main>
    );
  }
}
