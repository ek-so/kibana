/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PropsOf } from '@elastic/eui';
import type { FC, PropsWithChildren } from 'react';
import React, { useMemo, createElement, createContext, useContext } from 'react';
import type { CoreStart } from '@kbn/core/public';
import type { KibanaReactContextValue } from '@kbn/kibana-react-plugin/public';
import { createKibanaReactContext, useKibana } from '@kbn/kibana-react-plugin/public';
import type { InfraClientCoreSetup, InfraClientStartDeps, InfraClientStartExports } from '../types';

export type PluginKibanaContextValue = CoreStart & InfraClientStartDeps & InfraClientStartExports;

export interface KibanaEnvContext {
  kibanaVersion?: string;
  isCloudEnv?: boolean;
  isServerlessEnv?: boolean;
}

export const createKibanaContextForPlugin = (
  core: CoreStart,
  plugins: InfraClientStartDeps,
  pluginStart: InfraClientStartExports
) =>
  createKibanaReactContext<PluginKibanaContextValue>({
    ...core,
    ...plugins,
    ...pluginStart,
  });

export const KibanaEnvironmentContext = createContext<KibanaEnvContext>({});

export const useKibanaContextForPlugin =
  useKibana as () => KibanaReactContextValue<PluginKibanaContextValue>;

export const useKibanaContextForPluginProvider = (
  core: CoreStart,
  plugins: InfraClientStartDeps,
  pluginStart: InfraClientStartExports
) => {
  const { Provider } = useMemo(
    () => createKibanaContextForPlugin(core, plugins, pluginStart),
    [core, pluginStart, plugins]
  );
  return Provider;
};

export const useKibanaEnvironmentContextProvider = (kibanaEnvironment?: KibanaEnvContext) => {
  const value = useMemo(
    () => ({
      kibanaVersion: kibanaEnvironment?.kibanaVersion,
      isCloudEnv: kibanaEnvironment?.isCloudEnv,
      isServerlessEnv: kibanaEnvironment?.isServerlessEnv,
    }),
    [kibanaEnvironment]
  );

  const Provider: FC<PropsWithChildren<{ kibanaEnv?: KibanaEnvContext }>> = ({
    kibanaEnv = {},
    children,
  }) => {
    const newProvider = createElement(KibanaEnvironmentContext.Provider, {
      value: { ...kibanaEnv, ...value },
      children,
    });

    return newProvider;
  };

  return Provider;
};

export function useKibanaEnvironmentContext() {
  return useContext(KibanaEnvironmentContext);
}

export const createLazyComponentWithKibanaContext = <T extends React.ComponentType<any>>(
  coreSetup: InfraClientCoreSetup,
  lazyComponentFactory: () => Promise<{ default: T }>
) =>
  React.lazy(() =>
    Promise.all([lazyComponentFactory(), coreSetup.getStartServices()]).then(
      ([{ default: LazilyLoadedComponent }, [core, plugins, pluginStart]]) => {
        const { Provider } = createKibanaContextForPlugin(core, plugins, pluginStart);

        return {
          default: (props: PropsOf<T>) => (
            <Provider>
              <LazilyLoadedComponent {...props} />
            </Provider>
          ),
        };
      }
    )
  );
