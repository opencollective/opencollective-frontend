import styled from 'styled-components';
import StyledLink from '../StyledLink';

const HomePrimaryLink = styled(StyledLink)`
  text-align: center;
  padding: 16px;
  font-size: 15px;
  line-height: 18px;
  background: linear-gradient(180deg, #1869f5 0%, #1659e1 100%);
  min-width: 184px;

  @media screen and (min-width: 88em) {
    min-width: 232px;
  }
`;

HomePrimaryLink.defaultProps = {
  buttonStyle: 'primary',
};

export default HomePrimaryLink;
