/**
 * Unit tests for `useAsyncCall`: the returned `call`/`callWith` keep a stable identity across
 * renders so callers can safely use them in effect dependency arrays.
 */

import '@testing-library/jest-dom';

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { useAsyncCall } from './useAsyncCall';

const wrapper = ({ children }: { children: React.ReactNode }) => <IntlProvider locale="en">{children}</IntlProvider>;

describe('useAsyncCall', () => {
  it('keeps the call/callWith identities stable across renders', () => {
    const { result, rerender } = renderHook(({ fn }) => useAsyncCall(fn), {
      wrapper,
      initialProps: { fn: jest.fn().mockResolvedValue('first') },
    });

    const call = result.current.call;
    const callWith = result.current.callWith;

    // Even a brand-new inline `fn` must not change the returned callbacks
    rerender({ fn: jest.fn().mockResolvedValue('second') });

    expect(result.current.call).toBe(call);
    expect(result.current.callWith).toBe(callWith);
  });

  it('invokes the latest fn and exposes its result', async () => {
    const firstFn = jest.fn().mockResolvedValue('first');
    const { result, rerender } = renderHook(({ fn }) => useAsyncCall(fn), {
      wrapper,
      initialProps: { fn: firstFn },
    });

    const secondFn = jest.fn().mockResolvedValue('second');
    rerender({ fn: secondFn });

    await act(async () => {
      await result.current.call('arg');
    });

    expect(firstFn).not.toHaveBeenCalled();
    expect(secondFn).toHaveBeenCalledWith('arg');
    expect(result.current.data).toBe('second');
  });

  it('ignores stale responses from superseded calls', async () => {
    let resolveFirst: (value: string) => void;
    const firstPromise = new Promise<string>(resolve => {
      resolveFirst = resolve;
    });

    const fn = jest
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce('second');

    const { result } = renderHook(() => useAsyncCall(fn), { wrapper });

    let firstCall: Promise<void>;
    await act(async () => {
      firstCall = result.current.call();
      await result.current.call();
    });

    expect(result.current.data).toBe('second');

    await act(async () => {
      resolveFirst('first');
      await firstCall;
    });

    expect(result.current.data).toBe('second');
    expect(result.current.loading).toBe(false);
  });
});
