import React from 'react';

import { PlatformTipContainer, PlatformTipOption } from '../../components/contribution-flow/PlatformTipContainer';
import { Box } from '../../components/Grid';

const meta = {
  component: PlatformTipContainer,
};

export default meta;

function DefaultStory() {
  const amount = 10000;
  const [value, setValue] = React.useState(10000 * 0.15);
  const [selectedOption, setSelectedOption] = React.useState(PlatformTipOption.FIFTEEN_PERCENT);
  return (
    <Box>
      <PlatformTipContainer
        value={value}
        selectedOption={selectedOption}
        amount={amount}
        currency="USD"
        onChange={(option, value) => {
          setValue(value);
          setSelectedOption(option);
        }}
      />
      <Box mt={4}>
        Amount: {amount}
        <br />
        Platform tip: {value}
        <br />
        Platform tip option: {selectedOption}
        <br />
      </Box>
    </Box>
  );
}

export const Default = {
  render: () => {
    return <DefaultStory />;
  },
};
