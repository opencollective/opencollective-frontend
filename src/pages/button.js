import React from 'react';

class ButtonPage extends React.Component {
  static getInitialProps ({ query: { color, collectiveSlug, verb } }) {
    return { color, collectiveSlug, verb }
  }

  render() {
    const { color = 'white', collectiveSlug, verb = 'donate' } = this.props;

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

            .btn.contribute {
              width: 338px;
            }

            .donate.btn.blue {
              background-image: url(/static/images/buttons/donate-button-blue.svg);              
            }

            .donate.btn.white {
              background-image: url(/static/images/buttons/donate-button-white.svg);
            }

            .contribute.btn.blue {
              background-image: url(/static/images/buttons/contribute-button-blue.svg);              
            }

            .contribute.btn.white {
              background-image: url(/static/images/buttons/contribute-button-white.svg);
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
          <a type="button" className={`btn ${color} ${verb}`} target="_blank" href={`https://opencollective.com/${collectiveSlug}/${verb}`} />
        </div>
    );
  }
}

export default ButtonPage;
