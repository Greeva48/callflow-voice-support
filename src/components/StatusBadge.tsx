import React from 'react';

type Status = string;

const statusConfig: Record<string, { cls: string; label: string }> = {
  success: { cls: 'badge-success', label: 'Success' },
  failed: { cls: 'badge-danger', label: 'Failed' },
  'no-answer': { cls: 'badge-warning', label: 'No Answer' },
  busy: { cls: 'badge-warning', label: 'Busy' },
  queued: { cls: 'badge-blue', label: 'Queued' },
  'in-progress': { cls: 'badge-blue', label: 'In Progress' },
  new: { cls: 'badge-gray', label: 'New' },
  called: { cls: 'badge-blue', label: 'Called' },
  qualified: { cls: 'badge-success', label: 'Qualified' },
  disqualified: { cls: 'badge-danger', label: 'Disqualified' },
  callback: { cls: 'badge-warning', label: 'Callback' },
  draft: { cls: 'badge-gray', label: 'Draft' },
  running: { cls: 'badge-blue', label: 'Running' },
  completed: { cls: 'badge-success', label: 'Completed' },
  stopped: { cls: 'badge-danger', label: 'Stopped' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status] || { cls: 'badge-gray', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
