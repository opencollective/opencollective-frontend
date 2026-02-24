import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

import {
  ExportRequestStatus,
  type UseExportRequestCreateMutation,
  type UseExportRequestCreateMutationVariables,
  type UseExportRequestQuery,
  type UseExportRequestQueryVariables,
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
      error
      willRetry
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
  onError,
}: {
  pollInterval?: number;
  onSuccess?: (exportRequest: UseExportRequestQuery['exportRequest']) => void;
  onError?: (exportRequest: UseExportRequestQuery['exportRequest']) => void;
} = {}) {
  // Session key to track the current create request - increments on each create call
  const [sessionKey, setSessionKey] = React.useState(0);
  // Track which session the mutation result belongs to
  const [mutationSessionKey, setMutationSessionKey] = React.useState<number | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasFailed, setHasFailed] = React.useState(false);

  const [createMutation, { data: created, loading: isCreating, called, error: createError }] = useMutation<
    UseExportRequestCreateMutation,
    UseExportRequestCreateMutationVariables
  >(createExportRequestMutation);

  const {
    data,
    loading: isLoading,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery<UseExportRequestQuery, UseExportRequestQueryVariables>(exportRequestQuery, {
    // Only run query if we have a created export request for the current session
    skip: !called || !created || mutationSessionKey !== sessionKey,
    variables: {
      exportRequest: { id: created?.createExportRequest?.id },
    },
  });

  // Wrap create to reset state on each new call
  const create = React.useCallback(
    async (options: Parameters<typeof createMutation>[0]) => {
      // Increment session key for new request
      const newSessionKey = sessionKey + 1;
      setSessionKey(newSessionKey);
      setMutationSessionKey(null);
      setIsGenerating(false);
      setHasFailed(false);
      stopPolling();

      const result = await createMutation(options);

      // Mark mutation result as belonging to this session
      setMutationSessionKey(newSessionKey);

      return result;
    },
    [createMutation, stopPolling, sessionKey],
  );

  React.useEffect(() => {
    // Only process if we're in the correct session
    if (mutationSessionKey !== sessionKey) {
      return;
    }

    if (called && created && !createError && !data) {
      setIsGenerating(true);
      startPolling(pollInterval);
    } else if (called && createError) {
      setIsGenerating(false);
      setHasFailed(true);
      stopPolling();
    } else if (data?.exportRequest) {
      const { status } = data.exportRequest;
      // Type assertion needed until GraphQL types are regenerated
      const willRetry = (data.exportRequest as { willRetry?: boolean }).willRetry;

      // Keep polling for in-progress statuses
      if ([ExportRequestStatus.ENQUEUED, ExportRequestStatus.PROCESSING].includes(status)) {
        return;
      }

      // Handle failed status
      if (status === ExportRequestStatus.FAILED) {
        // If willRetry is true, keep polling - the request will be retried
        if (willRetry) {
          return;
        }
        // Permanent failure - stop polling and notify
        setIsGenerating(false);
        setHasFailed(true);
        stopPolling();
        onError?.(data.exportRequest);
        return;
      }

      // Handle completed status
      setIsGenerating(false);
      stopPolling();
      if (status === ExportRequestStatus.COMPLETED) {
        onSuccess?.(data.exportRequest);
      }
    }
  }, [
    called,
    created,
    createError,
    pollInterval,
    startPolling,
    stopPolling,
    data,
    onSuccess,
    onError,
    sessionKey,
    mutationSessionKey,
  ]);

  // Only return data if it belongs to the current session
  const currentData = mutationSessionKey === sessionKey ? data : undefined;

  return { create, isCreating, data: currentData, isLoading, refetch, isGenerating, hasFailed };
}

export default useExportRequest;
