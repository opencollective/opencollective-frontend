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
  z-index: 1;
`;

const PopupMenu = ({ Button, children, placement, onClose }) => {
  const [isOpen, setOpen] = React.useState(false);
  const ref = React.useRef();
  useGlobalBlur(ref, outside => {
    if (outside) {
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
          {({ style, ref }) => <Popup {...{ style, ref }}>{children}</Popup>}
        </Popper>
      )}
    </Box>
  );
};

PopupMenu.propTypes = {
  Button: PropTypes.func.isRequired,
  children: PropTypes.any.isRequired,
  placement: PropTypes.string,
  onClose: PropTypes.func,
};

export default PopupMenu;
