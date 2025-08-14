import React from 'react';

import { getWebsiteUrl } from '../../../lib/utils';

import Container from '../../Container';
import ExportImages from '../../ExportImages';
import { Box } from '../../Grid';

const Export = ({ collective }) => {
  const websiteUrl = getWebsiteUrl();
  const widgetCode = `<script src="${websiteUrl}/${collective.slug}/banner.js"></script>`;

  return (
    <div>
      <Container as="pre" fontSize="11px" whiteSpace="pre-wrap" mb={4}>
        {widgetCode}
      </Container>
      <Box my={4}>
        <ExportImages collective={collective} />
      </Box>
    </div>
  );
};

export default Export;
