import themeGet from '@styled-system/theme-get';
import styled from 'styled-components';

const HeroNote = styled.div`
  display: flex;
  align-items: center;
  margin: 5px 0;
  font-size: 16px;
  svg {
    flex: 0 0 auto;
    margin-right: 6px;
  }
  a {
    color: #333;
    &:focus {
      color: ${themeGet('colors.primary.700')};
      text-decoration: none;
    }

    &:hover {
      color: ${themeGet('colors.primary.400')};
      text-decoration: none;
    }
  }
`;

export default HeroNote;
