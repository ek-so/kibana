/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { FittingFunction } from '@kbn/expression-xy-plugin/common';
import { FittingFunctions } from '@kbn/expression-xy-plugin/public';

export const fittingFunctionDefinitions: Array<{ id: FittingFunction } & Record<string, string>> = [
  {
    id: FittingFunctions.NONE,
    title: i18n.translate('xpack.lens.fittingFunctionsTitle.none', {
      defaultMessage: 'Hide',
    }),
    description: i18n.translate('xpack.lens.fittingFunctionsDescription.none', {
      defaultMessage: 'Do not fill gaps',
    }),
  },
  {
    id: FittingFunctions.ZERO,
    title: i18n.translate('xpack.lens.fittingFunctionsTitle.zero', {
      defaultMessage: 'Zero',
    }),
    description: i18n.translate('xpack.lens.fittingFunctionsDescription.zero', {
      defaultMessage: 'Fill gaps with zeros',
    }),
  },
  {
    id: FittingFunctions.LINEAR,
    title: i18n.translate('xpack.lens.fittingFunctionsTitle.linear', {
      defaultMessage: 'Linear',
    }),
    description: i18n.translate('xpack.lens.fittingFunctionsDescription.linear', {
      defaultMessage: 'Fill gaps with a line',
    }),
  },
  {
    id: FittingFunctions.CARRY,
    title: i18n.translate('xpack.lens.fittingFunctionsTitle.carry', {
      defaultMessage: 'Last',
    }),
    description: i18n.translate('xpack.lens.fittingFunctionsDescription.carry', {
      defaultMessage: 'Fill gaps with the last value',
    }),
  },
  {
    id: FittingFunctions.LOOKAHEAD,
    title: i18n.translate('xpack.lens.fittingFunctionsTitle.lookahead', {
      defaultMessage: 'Next',
    }),
    description: i18n.translate('xpack.lens.fittingFunctionsDescription.lookahead', {
      defaultMessage: 'Fill gaps with the next value',
    }),
  },
];
