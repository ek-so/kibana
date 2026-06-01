/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Location } from 'history';
import type {
  ChromeProjectNavigationNode,
  NavigationTreeDefinitionUI,
} from './project_navigation';

const wrapIdx = (index: number): string => `[${index}]`;

/**
 * Flatten the navigation tree into a record of path => node
 * for quicker access when detecting the active path
 */
export const flattenNav = (
  navTree: ChromeProjectNavigationNode[],
  prefix: string[] = [],
  acc: Record<string, ChromeProjectNavigationNode> = {}
): Record<string, ChromeProjectNavigationNode> => {
  for (let idx = 0; idx < navTree.length; idx++) {
    const node = navTree[idx];
    const updatedPrefix = [...prefix, wrapIdx(idx)];
    const path = updatedPrefix.join('');
    const { children, ...rest } = node;
    acc[path] = children?.length ? rest : node;
    if (children?.length) {
      flattenNav(children, updatedPrefix, acc);
    }
  }
  return acc;
};

function truncateAt(str: string, divider: string): string {
  const position = str.indexOf(divider);
  return position !== -1 ? str.slice(0, position) : str;
}

export const stripQueryParams = (url: string) => truncateAt(url, '?');

function extractParentPaths(key: string, navTree: Record<string, ChromeProjectNavigationNode>) {
  const arr = key.split('][');
  if (arr.length === 1) {
    return arr;
  }
  arr[0] = `${arr[0]}]`;
  arr[arr.length - 1] = `[${arr[arr.length - 1]}`;
  for (let i = 1; i < arr.length - 1; i++) {
    arr[i] = `[${arr[i]}]`;
  }

  return arr
    .reduce<string[]>((acc, _currentValue, currentIndex) => {
      acc.push(arr.slice(0, currentIndex + 1).join(''));
      return acc;
    }, [])
    .filter((k) => Boolean(navTree[k]));
}

/**
 * Find the active nodes in the navigation tree based on the current pathname.
 */
export const findActiveNodes = (
  currentPathname: string,
  navTree: Record<string, ChromeProjectNavigationNode>,
  location?: Location,
  prepend: (path: string) => string = (path) => path
): ChromeProjectNavigationNode[][] => {
  const activeNodes: ChromeProjectNavigationNode[][] = [];
  let maxLength = 0;
  const matchesByLength = new Map<number, string[]>();

  const activeNodeFromKey = (key: string): ChromeProjectNavigationNode => ({
    ...navTree[key],
  });

  Object.entries(navTree).forEach(([key, node]) => {
    if (node.getIsActive && location) {
      const isActive = node.getIsActive({ pathNameSerialized: currentPathname, location, prepend });
      if (isActive) {
        const keysWithParents = extractParentPaths(key, navTree);
        activeNodes.push(keysWithParents.map(activeNodeFromKey));
      }
      return;
    }

    const nodePath = node.deepLink?.url ? stripQueryParams(node.deepLink.url) : undefined;

    if (nodePath) {
      const match = currentPathname.startsWith(nodePath);

      if (match) {
        const { length } = nodePath;
        const bucket = matchesByLength.get(length) ?? [];
        bucket.push(key);
        bucket.sort((a, b) => b.length - a.length);
        matchesByLength.set(length, bucket);
        if (length > maxLength) maxLength = length;
      }
    }
  });

  const longestMatch = matchesByLength.get(maxLength);
  if (longestMatch) {
    longestMatch.forEach((key) => {
      const keysWithParents = extractParentPaths(key, navTree);
      activeNodes.push(keysWithParents.map(activeNodeFromKey));
    });
  }

  return activeNodes;
};

const parseUrlForNavigation = (
  url: string
): {
  serializedPath: string;
  location: Location;
} => {
  const hashIndex = url.indexOf('#');
  const pathnamePart = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const pathname = stripQueryParams(pathnamePart);

  return {
    serializedPath: stripQueryParams(`${pathname}${hash}`),
    location: {
      pathname,
      hash,
      search: '',
      state: undefined,
      key: 'global-search',
    },
  };
};

/**
 * Returns a higher-level parent navigation title for a given URL, based on the
 * current solution's project navigation tree.
 *
 * For shallow paths (e.g. Machine Learning → Anomaly Detection), returns the
 * immediate parent. For deeper paths (e.g. Stack Management → Cluster performance
 * → Stack Monitoring), skips the intermediate section and returns the panel-level
 * ancestor (Stack Management).
 */
export const getNavigationParentTitleForUrl = ({
  url,
  navigationTree,
  prependBasePath = (path) => path,
}: {
  url: string;
  navigationTree: NavigationTreeDefinitionUI;
  prependBasePath?: (path: string) => string;
}): string | undefined => {
  const navNodes = [...(navigationTree.body ?? []), ...(navigationTree.footer ?? [])];
  if (navNodes.length === 0) {
    return undefined;
  }

  const { serializedPath, location } = parseUrlForNavigation(url);
  const flattened = flattenNav(navNodes);
  const activeNodes = findActiveNodes(serializedPath, flattened, location, prependBasePath);
  const activePath = activeNodes[0] ?? [];
  const pathWithTitle = activePath.filter((node) => Boolean(node.title));

  if (pathWithTitle.length < 2) {
    return undefined;
  }

  const parentIndex =
    pathWithTitle.length >= 3 ? pathWithTitle.length - 3 : pathWithTitle.length - 2;

  return pathWithTitle[parentIndex].title;
};
