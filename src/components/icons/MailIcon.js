import React from 'react';

const MailIcon = ({ size = '16', fill = '#9399A3', ...props }) => (
  <svg width={size} height={size * (14/16)} viewBox="0 0 16 14" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>email icon</title>
    <g id="Homepage" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Homepage---XS-(small-handset)" transform="translate(-264.000000, -10923.000000)" >
            <g id="FOOTER" transform="translate(0.000000, 10758.000000)">
                <g id="::-social-networks" transform="translate(24.000000, 148.000000)">
                    <g id="::-icon-(email)" transform="translate(224.000000, 0.000000)">
                        <path d="M30.4,17 L17.6,17 C16.72,17 16.008,17.9 16.008,19 L16,29 C16,30.1 16.72,31 17.6,31 L30.4,31 C31.28,31 32,30.1 32,29 L32,19 C32,17.9 31.28,17 30.4,17 Z M30,21 L24,25 L18,21 L18,19 L24,23 L30,19 L30,21 Z" id="email" fill={fill} fillRule="nonzero" />
                    </g>
                </g>
            </g>
        </g>
    </g>
  </svg>
);

export default MailIcon;
