/**
 * This file is a copy-paste from https://github.com/rebassjs/grid/blob/master/src/index.js.
 * See https://github.com/opencollective/opencollective/issues/2929 for more info.
 */

import styled from 'styled-components';
import { space, color, layout, flexbox, typography, compose } from 'styled-system';
import propTypes from '@styled-system/prop-types';

const boxProps = compose(space, color, layout, typography, flexbox);
export const Box = styled('div')(
  {
    boxSizing: 'border-box',
  },
  boxProps,
);

Box.displayName = 'Box';

Box.propTypes = {
  ...propTypes.space,
  ...propTypes.color,
  ...propTypes.layout,
  ...propTypes.typography,
  ...propTypes.flexbox,
};

export const Flex = styled(Box)({
  display: 'flex',
});

Flex.displayName = 'Flex';
