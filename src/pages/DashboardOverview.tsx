import { useDashboardData } from '@/hooks/useDashboardData';
import type { Test1223XxeErfassung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconCalendar, IconFileText, IconNotes, IconSearch, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Test1223XxeErfassungDialog } from '@/components/dialogs/Test1223XxeErfassungDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { StatCard } from '@/components/StatCard';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { de } from 'date-fns/locale';

const APPGROUP_ID = '6a044d0ef29b62e40f5c6d77';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    test1223XxeErfassung,
    loading, error, fetchAll,
  } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Test1223XxeErfassung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Test1223XxeErfassung | null>(null);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return test1223XxeErfassung;
    return test1223XxeErfassung.filter(r =>
      (r.fields.titel ?? '').toLowerCase().includes(q) ||
      (r.fields.beschreibung ?? '').toLowerCase().includes(q) ||
      (r.fields.bemerkung ?? '').toLowerCase().includes(q)
    );
  }, [test1223XxeErfassung, search]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const da = a.fields.datum ?? '';
      const db = b.fields.datum ?? '';
      return db.localeCompare(da);
    });
    const map: Record<string, Test1223XxeErfassung[]> = {};
    for (const r of sorted) {
      const key = r.fields.datum ?? '__kein_datum__';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return Object.entries(map);
  }, [filtered]);

  const todayCount = useMemo(() =>
    test1223XxeErfassung.filter(r => r.fields.datum && isToday(parseISO(r.fields.datum))).length,
    [test1223XxeErfassung]
  );
  const weekCount = useMemo(() =>
    test1223XxeErfassung.filter(r => r.fields.datum && isThisWeek(parseISO(r.fields.datum), { locale: de })).length,
    [test1223XxeErfassung]
  );
  const monthCount = useMemo(() =>
    test1223XxeErfassung.filter(r => r.fields.datum && isThisMonth(parseISO(r.fields.datum))).length,
    [test1223XxeErfassung]
  );

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function formatGroupLabel(dateKey: string) {
    if (dateKey === '__kein_datum__') return 'Kein Datum';
    try {
      const d = parseISO(dateKey);
      if (isToday(d)) return 'Heute';
      return format(d, 'EEEE, dd. MMMM yyyy', { locale: de });
    } catch {
      return dateKey;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteTest1223XxeErfassungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  }

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Erfassungen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{test1223XxeErfassung.length} Einträge gesamt</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0 gap-2">
          <IconPlus size={16} className="shrink-0" />
          <span>Neuer Eintrag</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(test1223XxeErfassung.length)}
          description="Alle Einträge"
          icon={<IconFileText size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Heute"
          value={String(todayCount)}
          description="Heutige Einträge"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Diese Woche"
          value={String(weekCount)}
          description="Wöchentliche Einträge"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Dieser Monat"
          value={String(monthCount)}
          description="Monatliche Einträge"
          icon={<IconNotes size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
        <Input
          placeholder="Suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grouped Entries */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed bg-muted/20">
          <IconFileText size={48} className="text-muted-foreground" stroke={1.5} />
          <div className="text-center">
            <p className="font-medium text-foreground">Noch keine Einträge</p>
            <p className="text-sm text-muted-foreground mt-1">Erstelle deinen ersten Eintrag mit dem Button oben.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, entries]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatGroupLabel(dateKey)}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{entries.length}</span>
              </div>
              <div className="space-y-2">
                {entries.map(record => {
                  const expanded = expandedIds.has(record.record_id);
                  const hasBeschreibung = !!record.fields.beschreibung;
                  const hasBemerkung = !!record.fields.bemerkung;
                  const hasExtra = hasBeschreibung || hasBemerkung;
                  return (
                    <div
                      key={record.record_id}
                      className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">
                              {record.fields.titel || '(Kein Titel)'}
                            </span>
                            {record.fields.datum && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDate(record.fields.datum)}
                              </span>
                            )}
                          </div>
                          {record.fields.beschreibung && !expanded && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {record.fields.beschreibung}
                            </p>
                          )}
                          {expanded && (
                            <div className="mt-2 space-y-2">
                              {hasBeschreibung && (
                                <div>
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Beschreibung</span>
                                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{record.fields.beschreibung}</p>
                                </div>
                              )}
                              {hasBemerkung && (
                                <div>
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bemerkung</span>
                                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{record.fields.bemerkung}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasExtra && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleExpand(record.record_id)}
                            >
                              {expanded
                                ? <IconChevronUp size={16} className="shrink-0" />
                                : <IconChevronDown size={16} className="shrink-0" />
                              }
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setEditRecord(record); setDialogOpen(true); }}
                          >
                            <IconPencil size={16} className="shrink-0" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(record)}
                          >
                            <IconTrash size={16} className="shrink-0" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <Test1223XxeErfassungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateTest1223XxeErfassungEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createTest1223XxeErfassungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Test1223XxeErfassung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Test1223XxeErfassung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={`Soll "${deleteTarget?.fields.titel || 'dieser Eintrag'}" wirklich gelöscht werden?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
