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

export default function LocalFilePreview(props: LocalFilePreviewProps) {
  const preview = React.useMemo(() => {
    if (props.file.type === 'application/pdf') {
      return <FileText opacity={0.25} />;
    }

    return <EmbeddedPreview file={props.file} size={props.size} />;
  }, [props.file.type, props.size]);

  return (
    <Box>
      <Box width={props.size} height={props.size}>
        {preview}
      </Box>

      <FileName fontSize="13px" fontWeight="700">
        {props.file.name}
      </FileName>
    </Box>
  );
}

function EmbeddedPreview(props: { file: File; size: number }) {
  const previewRef = React.useRef<HTMLEmbedElement>(null);

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = function () {
      previewRef.current.src = reader.result as string;
    };
    reader.readAsDataURL(props.file);
  }, [props.file, previewRef.current]);

  return <embed height="100%" width="100%" title={props.file.name} ref={previewRef} />;
}
