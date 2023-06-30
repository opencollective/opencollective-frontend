import React from 'react';
import { FileText } from '@styled-icons/feather/FileText';
import styled from 'styled-components';

import { Box } from './Grid';
import { P } from './Text';

const FileName = styled(P)`
  overflow: hidden;
  text-overflow: ellipsis;
`;

type LocalFilePreviewProps = {
  file: File;
  size: number;
};

const SUPPORTED_IMAGE_REGEX = /^image\/(jpeg|jpg|png|gif|webp)$/;

export default function LocalFilePreview(props: LocalFilePreviewProps) {
  return (
    <Box>
      <Box width={props.size} height={props.size}>
        {SUPPORTED_IMAGE_REGEX.test(props.file.type) ? (
          <img height="100%" width="100%" src={URL.createObjectURL(props.file)} alt={props.file.name} />
        ) : (
          <FileText opacity={0.25} />
        )}
      </Box>

      <FileName fontSize="13px" fontWeight="700" mt={2}>
        {props.file.name}
      </FileName>
    </Box>
  );
}
