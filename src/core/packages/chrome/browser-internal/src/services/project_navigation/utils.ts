/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type {
  ChromeNavLink,
  ChromeProjectNavigationNode,
  NavigationTreeDefinition,
  NodeDefinition,
  NavigationTreeDefinitionUI,
  AppDeepLinkId,
  SideNavNodeStatus,
  CloudLinkId,
  CloudLinks,
  SolutionId,
} from '@kbn/core-chrome-browser/src';
import type { SideNavigationSection } from '@kbn/core-chrome-browser/src/project_navigation';
import {
  findActiveNodes,
  flattenNav,
  stripQueryParams,
} from '@kbn/core-chrome-browser/src/project_navigation_utils';

export { findActiveNodes, flattenNav, stripQueryParams };

let uniqueId = 0;
const generateUniqueNodeId = () => `node${uniqueId++}`;

function isAbsoluteLink(link: string) {
  return link.startsWith('http://') || link.startsWith('https://');
}

function getNavigationNodeId(
  { id: _id, link }: Pick<NodeDefinition, 'id' | 'link'>,
  idGenerator = generateUniqueNodeId
): string {
  const id = _id ?? link;
  return id ?? idGenerator();
}

function getNodeStatus(
  {
    link,
    deepLink,
    cloudLink,
    sideNavStatus,
  }: {
    link?: string;
    deepLink?: ChromeNavLink;
    cloudLink?: CloudLinkId;
    sideNavStatus?: SideNavNodeStatus;
  },
  { cloudLinks }: { cloudLinks: CloudLinks }
): SideNavNodeStatus | 'remove' {
  if (link && (!deepLink || !deepLink.visibleIn.includes('projectSideNav'))) {
    // If a link is provided but no deepLink found, or the app excluded projectSideNav
    return 'remove';
  }

  if (cloudLink) {
    if (!cloudLinks[cloudLink]) {
      // Invalid cloudLinkId or link url has not been set in kibana.yml
      return 'remove';
    }
    // Cloud link permission checks are handled by the Cloud plugin's `getPrivilegedUrls()` method,
    // which gates URLs based on user privileges before they are set via `setCloudUrls()`.
  }

  return sideNavStatus ?? 'visible';
}

function getTitleForNode(
  navNode: { title?: string; deepLink?: { title: string }; cloudLink?: CloudLinkId },
  { deepLink, cloudLinks }: { deepLink?: ChromeNavLink; cloudLinks: CloudLinks }
): string | undefined {
  if (navNode.title) {
    return navNode.title;
  }

  if (deepLink?.title) {
    return deepLink.title;
  }

  if (navNode.cloudLink) {
    return cloudLinks[navNode.cloudLink]?.title ?? '';
  }

  return; // title is optional in EuiCollapsibleNavItemProps
}

function validateNodeProps<
  LinkId extends AppDeepLinkId = AppDeepLinkId,
  Id extends string = string,
  ChildrenId extends string = Id
>({ id, link, href, cloudLink, renderAs }: NodeDefinition<LinkId, Id, ChildrenId>) {
  if (link && cloudLink) {
    throw new Error(
      `[Chrome navigation] Error in node [${id}]. Only one of "link" or "cloudLink" can be provided.`
    );
  }
  if (href && cloudLink) {
    throw new Error(
      `[Chrome navigation] Error in node [${id}]. Only one of "href" or "cloudLink" can be provided.`
    );
  }
}

const initNavNode = <
  LinkId extends AppDeepLinkId = AppDeepLinkId,
  Id extends string = string,
  ChildrenId extends string = Id
>(
  node: NodeDefinition<LinkId, Id, ChildrenId>,
  {
    cloudLinks,
    deepLinks,
    parentNodePath,
    index = 0,
  }: {
    cloudLinks: CloudLinks;
    deepLinks: Record<string, ChromeNavLink>;
    parentNodePath?: string;
    index?: number;
  }
): ChromeProjectNavigationNode | null => {
  validateNodeProps(node);

  const { cloudLink, link, children, ...navNodeFromProps } = node;
  const deepLink = link !== undefined ? deepLinks[link] : undefined;
  const sideNavStatus = getNodeStatus(
    {
      link,
      deepLink,
      cloudLink,
      sideNavStatus: navNodeFromProps.sideNavStatus,
    },
    { cloudLinks }
  );

  if (sideNavStatus === 'remove') {
    return null;
  }

  const id = getNavigationNodeId(node, () => `node-${index}`) as Id;
  const title = getTitleForNode(node, { deepLink, cloudLinks });
  const isExternalLink = cloudLink != null;
  const href = isExternalLink ? cloudLinks[cloudLink]?.href : node.href;
  const path = parentNodePath ? `${parentNodePath}.${id}` : id;

  if (href && !isAbsoluteLink(href)) {
    throw new Error(`href must be an absolute URL. Node id [${id}].`);
  }

  const navNode: ChromeProjectNavigationNode = {
    ...navNodeFromProps,
    id,
    href: deepLink?.url ?? href,
    path,
    title,
    deepLink,
    isExternalLink,
    sideNavStatus,
  };

  return navNode;
};

export const parseNavigationTree = (
  id: SolutionId,
  navigationTreeDef: NavigationTreeDefinition,
  {
    deepLinks,
    cloudLinks,
  }: {
    deepLinks: Record<string, ChromeNavLink>;
    cloudLinks: CloudLinks;
  }
): {
  navigationTree: ChromeProjectNavigationNode[];
  navigationTreeUI: NavigationTreeDefinitionUI;
} => {
  // The navigation tree that represents the global navigation and will be used by the Chrome service
  const navigationTree: ChromeProjectNavigationNode[] = [];

  // Contains UI layout information (body, footer) and render "special" blocks like recently accessed.
  const navigationTreeUI: NavigationTreeDefinitionUI = { id, body: [] };

  const initNodeAndChildren = (
    node: NodeDefinition,
    { index = 0, parentPath = [] }: { index?: number; parentPath?: string[] } = {}
  ): ChromeProjectNavigationNode | null => {
    const navNode = initNavNode(node, {
      cloudLinks,
      deepLinks,
      parentNodePath: parentPath.length > 0 ? parentPath.join('.') : undefined,
      index,
    });

    if (navNode && node.children) {
      navNode.children = node.children
        .map((child, i) =>
          initNodeAndChildren(child, {
            index: i,
            parentPath: [...parentPath, navNode.id],
          })
        )
        .filter((child): child is ChromeProjectNavigationNode => child !== null);
    }

    return navNode;
  };

  const onNodeInitiated = (
    navNode: ChromeProjectNavigationNode | null,
    section: SideNavigationSection = 'body'
  ) => {
    if (navNode) {
      // Add the node to the global navigation tree
      navigationTree.push(navNode);

      // Add the node to the Side Navigation UI tree
      if (!navigationTreeUI[section]) {
        navigationTreeUI[section] = [];
      }
      navigationTreeUI[section]!.push(navNode);
    }
  };

  const parseNodesArray = (
    nodes?: NodeDefinition[],
    section: SideNavigationSection = 'body',
    startIndex = 0
  ): void => {
    if (!nodes) return;

    nodes.forEach((node, i) => {
      const navNode = initNodeAndChildren(node, { index: startIndex + i });
      onNodeInitiated(navNode, section);
    });
  };

  parseNodesArray(navigationTreeDef.body, 'body');
  parseNodesArray(navigationTreeDef.footer, 'footer', navigationTreeDef.body?.length ?? 0);

  return { navigationTree, navigationTreeUI };
};
