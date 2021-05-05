import PropTypes from 'prop-types';
import { has } from 'lodash';
import styled, { css } from 'styled-components';

/**
 * A background for the gift card redeem(ed) pages
 */
const HappyBackground = styled.div`
  width: 100%;
  background-position: center top;
  background-repeat: no-repeat;
  background-size: cover;
  clip-path: ellipse(125% 100% at 50% 0%);
  padding-bottom: 165px;

  ${({ theme, collective }) => {
    if (!collective || !has(collective, 'settings.collectivePage.primaryColor')) {
      return css`
        background: url('/static/images/redeem-hero.svg'), radial-gradient(#8a00df, #2e0044);
      `;
    } else {
      return css`
        background: url('/static/images/redeem-hero.svg'),
          radial-gradient(${theme.colors.primary[500]}, ${theme.colors.primary[900]});
      `;
    }
  }}
`;

HappyBackground.propTypes = {
  /** On optional collective with settings to get the primary color */
  collective: PropTypes.shape({
    settings: PropTypes.object,
  }),
};

/** @component */
export default HappyBackground;
