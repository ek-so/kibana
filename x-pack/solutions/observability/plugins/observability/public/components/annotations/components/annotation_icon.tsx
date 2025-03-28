/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiIcon, useEuiTheme } from '@elastic/eui';
import { annotationsIconSet } from '@kbn/event-annotation-components';
import type { IconType } from '@elastic/eui/src/components/icon/icon';
import type { Annotation, CreateAnnotationParams } from '../../../../common/annotations';

export interface AnnotationIconProps {
  annotation: Annotation | CreateAnnotationParams;
}

function AnnotationIcon({ annotation }: AnnotationIconProps) {
  const eventEnd = annotation.event?.end;
  const { euiTheme } = useEuiTheme();
  const annotationStyle = annotation.annotation?.style;
  const iconValue = annotation.annotation.style?.icon;

  const color = annotationStyle?.color ?? euiTheme.colors.accent;

  return (
    <EuiIcon
      type={
        eventEnd
          ? 'stopFilled'
          : (annotationsIconSet.find((icon) => icon.value === iconValue)?.icon as IconType) ??
            (iconValue as IconType)
      }
      color={color}
    />
  );
}

// eslint-disable-next-line import/no-default-export
export default AnnotationIcon;
