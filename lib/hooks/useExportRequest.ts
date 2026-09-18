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
      expiresAt
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
      stopPolling();

      const result = await createMutation(options);

      // Mark mutation result as belonging to this session
      setMutationSessionKey(newSessionKey);

      return result;
    },
    [createMutation, stopPolling, sessionKey],
  );

  const sessionActive = mutationSessionKey === sessionKey;
  const exportRequest = sessionActive ? data?.exportRequest : undefined;
  const exportStatus = exportRequest?.status;
  const willRetry = exportRequest ? (exportRequest as { willRetry?: boolean }).willRetry : undefined;

  const hasFailed =
    sessionActive && Boolean((called && createError) || (exportStatus === ExportRequestStatus.FAILED && !willRetry));

  const isGenerating =
    sessionActive &&
    called &&
    Boolean(created) &&
    !createError &&
    !hasFailed &&
    (!exportRequest ||
      [ExportRequestStatus.ENQUEUED, ExportRequestStatus.PROCESSING].includes(exportStatus) ||
      (exportStatus === ExportRequestStatus.FAILED && willRetry));

  React.useEffect(() => {
    if (!sessionActive) {
      return;
    }

    if (called && created && !createError && !data) {
      startPolling(pollInterval);
    } else if (called && createError) {
      stopPolling();
    } else if (exportRequest) {
      const { status } = exportRequest;

      if ([ExportRequestStatus.ENQUEUED, ExportRequestStatus.PROCESSING].includes(status)) {
        return;
      }

      if (status === ExportRequestStatus.FAILED) {
        if (willRetry) {
          return;
        }
        stopPolling();
        onError?.(exportRequest);
        return;
      }

      stopPolling();
      if (status === ExportRequestStatus.COMPLETED) {
        onSuccess?.(exportRequest);
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
    sessionActive,
    exportRequest,
    willRetry,
  ]);

  // Only return data if it belongs to the current session
  const currentData = sessionActive ? data : undefined;

  return { create, isCreating, data: currentData, isLoading, refetch, isGenerating, hasFailed };
}

export default useExportRequest;
