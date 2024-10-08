import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import Link from '../Link';
import Avatar from '../Avatar';

const collectiveHeaderQuery = gql`
  query CollectiveHeader($slug: String!) {
    account(slug: $slug) {
      id
      slug
      name
      type
      ... on AccountWithParent {
        parent {
          id
          slug
          name
        }
      }
    }
  }
`;
export function CollectiveHeader() {
  const router = useRouter();
  const { data, loading } = useQuery(collectiveHeaderQuery, {
    variables: { slug: router.query.accountSlug },
    context: API_V2_CONTEXT,
  });
  return (
    <div className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
        <Link href={`/preview/${data?.account.parent?.slug || data?.account.slug}`} className="flex items-center gap-2">
          <Avatar className="" collective={data?.account.parent || data?.account} /> <span>{data?.account.name}</span>
        </Link>
      </div>
    </div>
  );
}
