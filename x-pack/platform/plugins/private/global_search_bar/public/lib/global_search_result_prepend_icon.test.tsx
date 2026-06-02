/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import {
  createGlobalSearchResultPrepend,
  GlobalSearchResultPrependIcon,
  GLOBAL_SEARCH_RESULT_ICON_WRAPPER_SIZE_PX,
} from './global_search_result_prepend_icon';

describe('GlobalSearchResultPrependIcon', () => {
  it('renders nothing for the empty icon type', () => {
    const { container } = render(<GlobalSearchResultPrependIcon type="empty" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the icon inside a circular wrapper', () => {
    const { container, getByTestId } = render(<GlobalSearchResultPrependIcon type="gear" />);

    const wrapper = getByTestId('globalSearchResultPrependIcon');
    expect(wrapper).toHaveStyle({
      inlineSize: `${GLOBAL_SEARCH_RESULT_ICON_WRAPPER_SIZE_PX}px`,
      blockSize: `${GLOBAL_SEARCH_RESULT_ICON_WRAPPER_SIZE_PX}px`,
      borderRadius: '50%',
    });
    expect(container.querySelector('[data-euiicon-type="gear"]')).toBeTruthy();
  });

  it('renders with primary icon color for action prepends', () => {
    const { container } = render(<GlobalSearchResultPrependIcon type="plus" color="primary" />);

    expect(container.querySelector('[data-euiicon-type="plus"][color="primary"]')).toBeTruthy();
  });

  it('renders with accent icon and background for favorite prepends', () => {
    const { container, getByTestId } = render(
      <GlobalSearchResultPrependIcon type="productDashboard" color="accent" />
    );

    const wrapper = getByTestId('globalSearchResultPrependIcon');
    expect(wrapper).toHaveStyle({
      backgroundColor: 'var(--euiColorBackgroundLightAccent)',
    });
    expect(
      container.querySelector('[data-euiicon-type="productDashboard"]:not([color])')
    ).toBeTruthy();
  });
});

describe('createGlobalSearchResultPrepend', () => {
  it('returns undefined for the empty icon type', () => {
    expect(createGlobalSearchResultPrepend('empty')).toBeUndefined();
  });

  it('returns a prepend element for other icon types', () => {
    const prepend = createGlobalSearchResultPrepend('grid');
    expect(React.isValidElement(prepend)).toBe(true);
  });
});
