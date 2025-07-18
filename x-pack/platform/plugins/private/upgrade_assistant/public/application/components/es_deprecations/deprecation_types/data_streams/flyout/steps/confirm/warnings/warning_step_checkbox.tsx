/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import {
  EuiCheckbox,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { DocLinksStart } from '@kbn/core/public';

export const WarningCheckbox: React.FunctionComponent<{
  isChecked: boolean;
  warningId: string;
  label: React.ReactNode;
  description: React.ReactNode;
  documentationUrl?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ isChecked, warningId, label, onChange, description, documentationUrl }) => (
  <>
    <EuiText>
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false} data-test-subj="migrationWarningCheckbox">
          <EuiCheckbox
            id={warningId}
            label={<strong>{label}</strong>}
            checked={isChecked}
            onChange={onChange}
          />
        </EuiFlexItem>
        {documentationUrl !== undefined && (
          <EuiFlexItem grow={false}>
            <EuiLink href={documentationUrl} target="_blank" external={false}>
              <EuiIconTip
                content={
                  <FormattedMessage
                    id="xpack.upgradeAssistant.dataStream.migration.flyout.warningsStep.documentationLinkLabel"
                    defaultMessage="Documentation"
                  />
                }
                position="right"
                type="question"
              />
            </EuiLink>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiSpacer size="xs" />

      {description}
    </EuiText>

    <EuiSpacer />
  </>
);

export interface WarningCheckboxProps {
  isChecked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  docLinks: DocLinksStart['links'];
  id: string;
  meta?: {
    oldestIncompatibleDocTimestamp?: number;
  };
}
