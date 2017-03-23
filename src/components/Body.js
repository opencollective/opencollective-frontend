import React from 'react';

export default class Body extends React.Component {

  render() {
    return (
      <main>
        <style jsx>{`
        main {
          height: 100%;
          padding-bottom: 8rem;
        }
        @media(max-width: 600px) {
          main {
            padding-bottom: 16rem;
          }
        }
        `}</style>
        {this.props.children}
      </main>
    );
  }
}
