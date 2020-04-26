import styled from 'styled-components';

import Container from '../Container';

import { Dimensions } from './_constants';

/**
 * A special container that center the content with the correct width and margins
 * for the collective page.
 */
const ContainerSectionContent = styled(Container).attrs({
  maxWidth: Dimensions.MAX_SECTION_WIDTH,
  px: Dimensions.PADDING_X,
  m: '0 auto',
})``;

/** @component */
export default ContainerSectionContent;
