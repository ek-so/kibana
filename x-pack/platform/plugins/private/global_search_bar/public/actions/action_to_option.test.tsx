/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { actionToOption } from './action_to_option';
import { GLOBAL_SEARCH_ACTION_OPTION_TYPE } from './types';

describe('actionToOption', () => {
  it('maps an action to a selectable option with primary plus icon and append', () => {
    const option = actionToOption({
      id: 'create-dashboard',
      title: 'Create dashboard',
      appendLabel: 'Dashboards',
      icon: 'plus',
      execute: jest.fn(),
    });

    expect(option.key).toBe('create-dashboard');
    expect(option.label).toBe('Create dashboard');
    expect(option.type).toBe(GLOBAL_SEARCH_ACTION_OPTION_TYPE);

    const { container, getByText } = render(<>{option.prepend}{option.append}</>);
    expect(container.querySelector('[data-euiicon-type="plus"]')).toBeTruthy();
    expect(getByText('Dashboards')).toBeInTheDocument();
  });
});
