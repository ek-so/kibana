/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { act, renderHook } from '@testing-library/react';
import { useSearchModalStack } from './use_search_modal_stack';
import {
  GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID,
  GLOBAL_SEARCH_MODAL_ROOT_SCREEN_ID,
} from '../search_modal/search_modal_stack';

describe('useSearchModalStack', () => {
  it('starts on the root screen', () => {
    const { result } = renderHook(() => useSearchModalStack());

    expect(result.current.isNested).toBe(false);
    expect(result.current.currentScreen.id).toBe(GLOBAL_SEARCH_MODAL_ROOT_SCREEN_ID);
  });

  it('pushes and pops screens while preserving parent search state', () => {
    const { result } = renderHook(() => useSearchModalStack());

    act(() => {
      result.current.pushScreen(
        { id: GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID, title: 'Recent' },
        'dashboard'
      );
    });

    expect(result.current.isNested).toBe(true);
    expect(result.current.currentScreen.title).toBe('Recent');

    let parentSnapshot: { searchValue: string } | undefined;

    act(() => {
      parentSnapshot = result.current.popScreen();
    });

    expect(parentSnapshot).toEqual({ searchValue: 'dashboard' });
    expect(result.current.isNested).toBe(false);
    expect(result.current.currentScreen.id).toBe(GLOBAL_SEARCH_MODAL_ROOT_SCREEN_ID);
  });
});
