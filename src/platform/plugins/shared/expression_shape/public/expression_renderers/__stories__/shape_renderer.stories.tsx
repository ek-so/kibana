/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { coreMock } from '@kbn/core/public/mocks';
import { Render } from '@kbn/presentation-util-plugin/public/__stories__';
import { getShapeRenderer } from '..';
import { Shape } from '../../../common/types';

export default {
  title: 'renderers/shape',
};

export const Default = {
  render: () => {
    const config = {
      type: 'shape' as 'shape',
      border: '#FFEEDD',
      borderWidth: 8,
      shape: Shape.BOOKMARK,
      fill: '#112233',
      maintainAspect: true,
    };

    return <Render renderer={getShapeRenderer(coreMock.createStart())} config={config} />;
  },

  name: 'default',
};
