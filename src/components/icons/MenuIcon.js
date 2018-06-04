import React from 'react';

const MenuIcon = ({ size = 20, fill = '#000000', ...props }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 20 14" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>menu icon</title>
    <path d="M19,6 L1,6 C0.4,6 0,6.4 0,7 C0,7.6 0.4,8 1,8 L19,8 C19.6,8 20,7.6 20,7 C20,6.4 19.6,6 19,6 Z" fill={fill} fillRule="nonzero" />
    <path d="M0.85,2 L16.15,2 C16.66,2 17,1.6 17,1 C17,0.4 16.66,0 16.15,0 L0.85,0 C0.34,0 0,0.4 0,1 C0,1.6 0.34,2 0.85,2 Z" fill={fill} fillRule="nonzero" />
    <path d="M16.15,12 L0.85,12 C0.34,12 0,12.4 0,13 C0,13.6 0.34,14 0.85,14 L16.15,14 C16.66,14 17,13.6 17,13 C17,12.4 16.66,12 16.15,12 Z" fill={fill} fillRule="nonzero" />
  </svg>
) ;

export default MenuIcon;
