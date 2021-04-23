import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const CollectButton = styled.div`
  background-color: transparent;
  background-image: ${({ color, verb }) => `url(/static/images/buttons/${verb}-button-${color}.svg)`};
  background-repeat: no-repeat;
  cursor: pointer;
  display: block;
  float: left;
  height: 50px;
  margin: 0;
  overflow: hidden;
  padding: 0;
  width: ${({ verb }) => (verb === 'contribute' ? '338px' : '300px')};

  &:hover {
    background-position: 0 -50px;
  }

  &:active {
    background-position: 0 -100px;
  }

  &:focus {
    outline: 0;
  }
`;

class ButtonPage extends React.Component {
  static getInitialProps({ query: { color, collectiveSlug, verb }, res }) {
    // Allow to be embedded as Iframe everywhere
    if (res) {
      res.removeHeader('X-Frame-Options');
    }
    return { color, collectiveSlug, verb };
  }

  static propTypes = {
    color: PropTypes.string,
    collectiveSlug: PropTypes.string,
    verb: PropTypes.string,
  };

  render() {
    const { color = 'white', collectiveSlug, verb = 'donate' } = this.props;

    return (
      <a target="_blank" rel="noopener noreferrer" href={`https://opencollective.com/${collectiveSlug}/${verb}`}>
        <CollectButton color={color} verb={verb} />
      </a>
    );
  }
}

export default ButtonPage;
