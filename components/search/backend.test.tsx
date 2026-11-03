jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: { hasPreviewFeatureEnabled: () => true }, loadingLoggedInUser: false }),
}));

import { act, renderHook } from '@testing-library/react';

import { SearchBackend } from '../../lib/graphql/types/v2/graphql';
import { LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import { useSearchBackend } from './backend';
import { SearchEntity } from './filters';

const queryFilter = { values: { entity: SearchEntity.ALL, limit: 10 }, setFilter: jest.fn() };

describe('useSearchBackend', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps every mounted instance on the backend selected in one of them', () => {
    const commandBackend = renderHook(() => useSearchBackend(queryFilter));
    const pageBackend = renderHook(() => useSearchBackend(queryFilter));
    expect(commandBackend.result.current.backend).toBe(SearchBackend.OPENSEARCH);
    expect(pageBackend.result.current.backend).toBe(SearchBackend.OPENSEARCH);

    act(() => commandBackend.result.current.setBackend(SearchBackend.POSTGRES));
    expect(commandBackend.result.current.backend).toBe(SearchBackend.POSTGRES);
    expect(pageBackend.result.current.backend).toBe(SearchBackend.POSTGRES);
    expect(JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_BACKEND))).toBe(SearchBackend.POSTGRES);

    act(() => pageBackend.result.current.setBackend(SearchBackend.OPENSEARCH));
    expect(commandBackend.result.current.backend).toBe(SearchBackend.OPENSEARCH);
    expect(pageBackend.result.current.backend).toBe(SearchBackend.OPENSEARCH);
  });
});
