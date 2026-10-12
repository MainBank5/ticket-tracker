import { STATUS_LABELS, TICKET_STATUSES, type TicketStats, type TicketStatus } from '@/lib/types';

export type Filter = 'all' | TicketStatus;

interface Props {
  value: Filter;
  stats: TicketStats | null;
  onChange: (filter: Filter) => void;
}

// Doubles as the stats display: each tab shows the count from GET /tickets/stats.
export function StatusFilter({ value, stats, onChange }: Props) {
  const tabs: { key: Filter; label: string; count: number | undefined }[] = [
    { key: 'all', label: 'All', count: stats?.total },
    ...TICKET_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], count: stats?.[s] })),
  ];

  return (
    <div className="tabs" role="group" aria-label="Filter by status">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={tab.key === value ? 'tab active' : 'tab'}
          aria-pressed={tab.key === value}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
