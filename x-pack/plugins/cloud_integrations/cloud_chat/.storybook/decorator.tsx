/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, PropsWithChildren } from 'react';
import { DecoratorFn } from '@storybook/react';
import { ServicesProvider, CloudChatServices } from '../public/services';

// TODO: move to a storybook implementation of the service using parameters.
const services: CloudChatServices = {
  chat: {
    chatURL: 'https://elasticcloud-production-chat-us-east-1.s3.amazonaws.com/drift-iframe.html',
    chatVariant: 'bubble',
    user: {
      id: 'user-id',
      email: 'test-user@elastic.co',
      // this doesn't affect chat appearance,
      // but a user identity in Drift only
      jwt: 'identity-jwt',
      trialEndDate: new Date(),
      kbnVersion: '8.9.0',
      kbnBuildNum: 12345,
    },
  },
};

export const getCloudContextProvider: () => FC<PropsWithChildren<unknown>> =
  () =>
  ({ children }) =>
    <ServicesProvider {...services}>{children}</ServicesProvider>;

export const getCloudContextDecorator: DecoratorFn = (storyFn) => {
  const CloudContextProvider = getCloudContextProvider();
  return <CloudContextProvider>{storyFn()}</CloudContextProvider>;
};
