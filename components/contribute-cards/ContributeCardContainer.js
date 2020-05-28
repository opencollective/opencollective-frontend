import css from '@styled-system/css';
import styled from 'styled-components';

import { Box } from '../Grid';

export const CONTRIBUTE_CARD_PADDING_X = [15, 18];

const ContributeCardContainer = styled(Box).attrs({ px: CONTRIBUTE_CARD_PADDING_X })(
  css({
    scrollSnapAlign: ['center', null, 'start'],
  }),
);

export default ContributeCardContainer;
