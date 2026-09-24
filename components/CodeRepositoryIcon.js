import React from 'react';
import { Code as CodeRepositoryGenericIcon } from '@styled-icons/fa-solid/Code';
import { Github } from '@styled-icons/feather/Github';

const CodeRepositoryIcon = ({ repositoryUrl, ...props }) => {
  const isGithubUrl = repositoryUrl?.match(/^(https?:\/\/)?github\.com\//);
  return isGithubUrl ? <Github {...props} /> : <CodeRepositoryGenericIcon {...props} />;
};

export default CodeRepositoryIcon;
