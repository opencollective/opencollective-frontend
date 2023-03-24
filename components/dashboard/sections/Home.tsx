import React from 'react';

import { AdminSectionProps } from '../types';

const Home = (props: AdminSectionProps) => {
  return <div>Home for {props.account?.slug}</div>;
};

export default Home;
