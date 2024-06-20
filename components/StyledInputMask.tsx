import React from 'react';
import MaskedInput from 'react-text-mask';

import StyledInput from './StyledInput';

interface StyledInputMaskProps extends React.ComponentProps<typeof MaskedInput> {
  render?: (ref: React.Ref<any>, props: any) => React.ReactNode;
}

const DefaultMaskRenderer = (ref, props) => <StyledInput ref={ref} {...props} />;

const StyledInputMask = ({ render = DefaultMaskRenderer, ...props }: StyledInputMaskProps) => (
  <MaskedInput render={render} {...props} />
);

export default StyledInputMask;
