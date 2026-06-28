'use client';

import React from 'react';

import { VISUALIZATION_TEMPLATE_REGISTRY } from './registry';
import type { ValidatedVisualizationPayload } from './schema';
import { validateVisualizationPayload } from './validator';

interface VisualRendererProps {
  visualData: ValidatedVisualizationPayload;
  fallback?: React.ReactNode;
}

export default function VisualRenderer({ visualData, fallback }: VisualRendererProps) {
  const RegistryComponent = VISUALIZATION_TEMPLATE_REGISTRY[visualData.type as keyof typeof VISUALIZATION_TEMPLATE_REGISTRY];
  if (!RegistryComponent) {
    return <>{fallback ?? <div className="text-gray-400 text-sm">Visual not available</div>}</>;
  }

  const validationResult = validateVisualizationPayload(visualData);
  if (!validationResult.isValid) {
    return (
      <>
        {fallback ?? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Visual đang dùng fallback an toàn vì dữ liệu chưa hợp lệ.
          </div>
        )}
      </>
    );
  }

  return (
    <RegistryComponent
      primaryCount={visualData.primaryCount}
      secondaryCount={visualData.secondaryCount}
      totalCount={visualData.totalCount}
      groupsLabel={visualData.groupsLabel}
      itemsLabel={visualData.itemsLabel}
      config={visualData.config}
    />
  );
}
