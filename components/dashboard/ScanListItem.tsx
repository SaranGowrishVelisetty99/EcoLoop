'use client';

import { Badge as BadgeUI } from '@/components/ui/badge';
import { Button as ButtonUI } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { memo, useCallback } from 'react';
import { ScanDoc } from '@/types';

interface ScanListItemProps {
  scan: ScanDoc;
  onDelete: (scanId: string) => void;
}

export const ScanListItem = memo(function ScanListItem({ scan, onDelete }: ScanListItemProps) {
  const handleDelete = useCallback(() => {
    onDelete(scan.id);
  }, [onDelete, scan.id]);

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{scan.detectedObject || 'Item under analysis'}</p>
          <p className="text-sm text-slate-300">{scan.materialType || 'Material type pending'} · {scan.conditionAssessment || 'Analysis in progress'}</p>
        </div>
        <div className="flex items-center gap-2">
          <BadgeUI>{scan.confidenceScore ? `${Math.round(scan.confidenceScore * 100)}% confidence` : 'Awaiting AI'}</BadgeUI>
          <ButtonUI variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={handleDelete} aria-label={`Delete scan: ${scan.detectedObject || 'Item under analysis'}`}>
            <Trash2 size={16} aria-hidden="true" />
          </ButtonUI>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(scan.suggestions ?? []).slice(0, 2).map((suggestion) => (
          <span key={`${scan.id}-${suggestion.title}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{suggestion.title}</span>
        ))}
      </div>
    </article>
  );
});

ScanListItem.displayName = 'ScanListItem';