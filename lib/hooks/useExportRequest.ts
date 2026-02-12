import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

import type {
  UseExportRequestCreateMutation,
  UseExportRequestCreateMutationVariables,
  UseExportRequestQuery,
  UseExportRequestQueryVariables,
} from '../graphql/types/v2/graphql';

const createExportRequestMutation = gql`
  mutation UseExportRequestCreate($exportRequest: ExportRequestCreateInput!) {
    createExportRequest(exportRequest: $exportRequest) {
      id
      legacyId
      name
      type
      status
    }
  }
`;

const exportRequestQuery = gql`
  query UseExportRequest($exportRequest: ExportRequestReferenceInput!) {
    exportRequest(exportRequest: $exportRequest) {
      id
      legacyId
      name
      type
      status
      progress
      file {
        id
        url
        name
        size
      }
    }
  }
`;

function useExportRequest({
  pollInterval = 5_000,
  onSuccess,
}: {
  pollInterval?: number;
  onSuccess?: (exportRequest: UseExportRequestQuery['exportRequest']) => void;
} = {}) {
  const [create, { data: created, loading: isCreating, called, error: createError }] = useMutation<
    UseExportRequestCreateMutation,
    UseExportRequestCreateMutationVariables
  >(createExportRequestMutation);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const {
    data,
    loading: isLoading,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery<UseExportRequestQuery, UseExportRequestQueryVariables>(exportRequestQuery, {
    skip: !called || !created,
    variables: {
      exportRequest: { id: created?.createExportRequest?.id },
    },
  });

  React.useEffect(() => {
    if (called && created && !createError && data?.exportRequest?.status !== 'COMPLETED') {
      setIsGenerating(true);
      startPolling(pollInterval);
    } else if (called && createError) {
      setIsGenerating(false);
      stopPolling();
    } else if (data && data.exportRequest) {
      setIsGenerating(false);
      stopPolling();
      if (data.exportRequest?.status === 'COMPLETED') {
        onSuccess?.(data.exportRequest);
      }
    }
  }, [called, created, createError, pollInterval, startPolling, stopPolling, data, onSuccess]);

  return { create, isCreating, data, isLoading, refetch, isGenerating };
}

export default useExportRequest;
