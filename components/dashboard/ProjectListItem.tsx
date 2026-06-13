'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Button as ButtonUI } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectDoc } from '@/types';

interface ProjectListItemProps {
  project: ProjectDoc;
  status: 'saved' | 'in_progress' | 'completed';
  onDelete: (projectId: string) => void;
}

export const ProjectListItem = memo(function ProjectListItem({ project, status, onDelete }: ProjectListItemProps) {
  const router = useRouter();
  const handleDelete = useCallback(() => {
    onDelete(project.id);
  }, [onDelete, project.id]);

  const navigate = useCallback(() => {
    router.push(`/dashboard/project/${project.id}`);
  }, [router, project.id]);

  const statusConfig = {
    saved: {
      label: 'Ready to start',
      badgeClass: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
      buttonText: 'Start project',
    },
    in_progress: {
      label: 'In progress',
      badgeClass: 'border-brand-500/30 bg-brand-500/10 text-brand-100',
      buttonText: 'Continue project',
    },
    completed: {
      label: 'Completed',
      badgeClass: 'border-green-500/30 bg-green-500/10 text-green-300',
      buttonText: 'View details',
    },
  };

  const config = statusConfig[status];

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{project.suggestionTitle}</p>
          <p className="text-sm text-slate-300">{config.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <BadgeUI className={config.badgeClass}>{status}</BadgeUI>
          <ButtonUI variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => onDelete(project.id)} aria-label="Delete project">
            <Trash2 size={16} aria-hidden="true" />
          </ButtonUI>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-200/90">Linked scan: {project.scanId}</p>
      <ButtonUI variant="outline" className="mt-4" onClick={navigate}>{config.buttonText}</ButtonUI>
    </article>
  );
});

ProjectListItem.displayName = 'ProjectListItem';