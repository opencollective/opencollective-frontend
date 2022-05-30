import React from 'react';
import PropTypes from 'prop-types';
import { Popper } from 'react-popper';
import styled from 'styled-components';

import useGlobalBlur from '../lib/hooks/useGlobalBlur';

import { Box } from './Grid';

const Popup = styled(Box)`
  position: absolute;
  padding: 8px;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  background: white;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  z-index: ${props => props.zIndex ?? 1000};
`;

const PopupMenu = ({ Button, children, placement, onClose, zIndex }) => {
  const [isOpen, setOpen] = React.useState(false);
  const ref = React.useRef();
  useGlobalBlur(ref, outside => {
    if (isOpen && outside) {
      setOpen(false);
      onClose?.();
    }
  });

  return (
    <Box ref={ref}>
      <Button onClick={() => setOpen(!isOpen)} />
      {isOpen && (
        <Popper
          placement={placement || 'bottom'}
          referenceElement={ref?.current}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
          ]}
        >
          {({ style, ref }) => (
            <Popup zIndex={zIndex} {...{ style, ref }}>
              {typeof children === 'function' ? children({ setOpen }) : children}
            </Popup>
          )}
        </Popper>
      )}
    </Box>
  );
};

PopupMenu.propTypes = {
  Button: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  placement: PropTypes.string,
  onClose: PropTypes.func,
  zIndex: PropTypes.number,
};

export default PopupMenu;
