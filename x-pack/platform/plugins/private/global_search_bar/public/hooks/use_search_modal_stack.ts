/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  GlobalSearchModalScreenId,
  GlobalSearchModalStackFrame,
  GlobalSearchModalStackSnapshot,
} from '../search_modal/search_modal_stack';
import { createRootStackFrame } from '../search_modal/search_modal_stack';

export interface PushSearchModalScreenParams {
  id: GlobalSearchModalScreenId;
  title: string;
}

export interface UseSearchModalStackResult {
  currentScreen: GlobalSearchModalStackFrame;
  isNested: boolean;
  pushScreen: (params: PushSearchModalScreenParams, currentSearchValue: string) => void;
  popScreen: () => GlobalSearchModalStackSnapshot | undefined;
  resetStack: () => void;
}

export const useSearchModalStack = (): UseSearchModalStackResult => {
  const [stack, setStack] = useState<GlobalSearchModalStackFrame[]>([createRootStackFrame()]);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const currentScreen = stack[stack.length - 1];
  const isNested = stack.length > 1;

  const pushScreen = useCallback(
    ({ id, title }: PushSearchModalScreenParams, currentSearchValue: string) => {
      setStack((previousStack) => {
        const nextStack = [...previousStack];
        const activeIndex = nextStack.length - 1;

        nextStack[activeIndex] = {
          ...nextStack[activeIndex],
          snapshot: { searchValue: currentSearchValue },
        };

        nextStack.push({
          id,
          title,
          snapshot: { searchValue: '' },
        });

        return nextStack;
      });
    },
    []
  );

  const popScreen = useCallback((): GlobalSearchModalStackSnapshot | undefined => {
    const currentStack = stackRef.current;

    if (currentStack.length <= 1) {
      return undefined;
    }

    const parentSnapshot = currentStack[currentStack.length - 2].snapshot;
    setStack(currentStack.slice(0, -1));
    return parentSnapshot;
  }, []);

  const resetStack = useCallback(() => {
    setStack([createRootStackFrame()]);
  }, []);

  return useMemo(
    () => ({
      currentScreen,
      isNested,
      pushScreen,
      popScreen,
      resetStack,
    }),
    [currentScreen, isNested, pushScreen, popScreen, resetStack]
  );
};
