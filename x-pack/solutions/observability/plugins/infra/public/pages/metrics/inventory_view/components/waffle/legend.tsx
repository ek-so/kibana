/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import styled from '@emotion/styled';
import type {
  InfraFormatter,
  InfraWaffleMapBounds,
  InfraWaffleMapLegend,
} from '../../../../../common/inventory/types';
import {
  SteppedGradientLegendRT,
  StepLegendRT,
  GradientLegendRT,
} from '../../../../../common/inventory/types';
import { GradientLegend } from './gradient_legend';
import { StepLegend } from './steps_legend';
import { SteppedGradientLegend } from './stepped_gradient_legend';
interface Props {
  legend: InfraWaffleMapLegend;
  bounds: InfraWaffleMapBounds;
  dataBounds: InfraWaffleMapBounds;
  formatter: InfraFormatter;
}

export const Legend: React.FC<Props> = ({ legend, bounds, formatter }) => {
  return (
    <LegendContainer>
      {GradientLegendRT.is(legend) && (
        <GradientLegend formatter={formatter} legend={legend} bounds={bounds} />
      )}
      {StepLegendRT.is(legend) && <StepLegend formatter={formatter} legend={legend} />}
      {SteppedGradientLegendRT.is(legend) && (
        <SteppedGradientLegend formatter={formatter} bounds={bounds} legend={legend} />
      )}
    </LegendContainer>
  );
};

const LegendContainer = styled.div`
  margin: 0 10px;
  display: flex;
`;
