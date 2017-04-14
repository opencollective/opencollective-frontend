import React from 'react';

class ButtonPage extends React.Component {
  static getInitialProps ({ query: { color, collectiveSlug } }) {
    return { color, collectiveSlug }
  }

  render() {
    const { color = 'white', collectiveSlug } = this.props;
    return (
        <div>
          <style jsx>{`
            :global(body) {
              margin: 0;
            }

            .btn { 
            width: 300px;
            height: 50px;
            overflow: hidden;
            margin: 0;
              padding: 0;
              background-repeat: no-repeat;
                float:left;
              border: none;
              background-color: transparent;
              cursor: pointer;
            }

            .btn.blue {
              background-image: url(/static/images/buttons/donate-button-blue.svg);              
            }

            .btn.white {
              background-image: url(/static/images/buttons/donate-button-white.svg);
            }

            .btn:hover {
              background-position: 0 -50px;
            }
            .btn:active {
              background-position: 0 -100px;
            }
            .btn:focus {
              outline: 0;
            }

            .btn.hover {
              background-position: 0 -100px;
            }
          `}</style>
          <a type="button" className={`btn ${color}`} target="_blank" href={`https://opencollective.com/${collectiveSlug}/donate`} />
        </div>
    );
  }
}

export default ButtonPage;
