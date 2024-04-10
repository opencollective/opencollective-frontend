import { useRouter } from 'next/router';
import React from 'react';
import type { GetServerSideProps } from 'next';
// ignore unused exports default
// next.js export
export const getServerSideProps: GetServerSideProps = async ctx => {
  console.log('in getserversideprops', { ctx });
  return {
    props: {
      propsCtx: ctx,
    },
  };
};
export default function TransactionsPage(props) {
  const router = useRouter();
  console.log({ props, router });
  return <div>{JSON.stringify({ props, router })}</div>;
}
