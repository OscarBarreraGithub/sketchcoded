import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '../shared/model';
import { api } from './api';
export type Update = (
  recipe: (project: Project) => Project,
  /** `quiet`: a presentation change (where the board is looked at from). It is saved, but it is
   * not an edit: the save indicator and the leave warning ignore it. */
  options?: { history?: boolean; group?: string; quiet?: boolean },
) => void;
/** True when the only difference between two copies is where the board is looked at from. */
const onlyViewportChanged = (a: Project, b: Project) => {
  const strip = (p: Project) =>
    JSON.stringify({ ...p, viewport: undefined, revision: undefined, updatedAt: undefined });
  return strip(a) === strip(b);
};
export function useProject(initial: Project) {
  const [project, setProject] = useState(initial),
    current = useRef(initial),
    lastSaved = useRef(initial);
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved'),
    [error, setError] = useState('');
  const version = useRef(0),
    savedVersion = useRef(0),
    quietOnly = useRef(true),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    running = useRef<Promise<boolean> | null>(null);
  const past = useRef<Project[]>([]),
    future = useRef<Project[]>([]),
    lastGroup = useRef({ key: '', time: 0 });
  const [historyTick, setHistoryTick] = useState(0),
    [refreshed, setRefreshed] = useState(0);
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    if (running.current) {
      const ok = await running.current;
      return ok && savedVersion.current !== version.current ? flush() : ok;
    }
    if (savedVersion.current === version.current) return true;
    const save = async () => {
      const silent = quietOnly.current;
      if (!silent) setStatus('saving');
      try {
        while (savedVersion.current !== version.current) {
          const snapshot = current.current,
            atVersion = version.current;
          let saved: Project;
          try {
            saved = await api<Project>(`/api/projects/${snapshot.id}`, {
              method: 'PUT',
              body: JSON.stringify(snapshot),
            });
          } catch (e) {
            // Rule (2026-09-26): the agent talks to the running app. When it wrote the board while
            // this tab only moved its viewport, take the newer copy and keep looking where we were.
            if (
              (e as { status?: number }).status === 409 &&
              onlyViewportChanged(snapshot, lastSaved.current)
            ) {
              const fresh = await api<Project>(`/api/projects/${snapshot.id}`);
              current.current = { ...fresh, viewport: current.current.viewport };
              lastSaved.current = fresh;
              past.current = [];
              future.current = [];
              setProject(current.current);
              setRefreshed((n) => n + 1);
              continue;
            }
            throw e;
          }
          current.current = {
            ...current.current,
            revision: saved.revision,
            updatedAt: saved.updatedAt,
          };
          lastSaved.current = { ...snapshot, revision: saved.revision, updatedAt: saved.updatedAt };
          setProject(current.current);
          savedVersion.current = atVersion;
        }
        quietOnly.current = true;
        if (!silent) setStatus('saved');
        setError('');
        return true;
      } catch (e) {
        setStatus('error');
        setError((e as Error).message);
        return false;
      }
    };
    running.current = save();
    const ok = await running.current;
    running.current = null;
    return ok;
  }, []);
  const update: Update = useCallback(
    (recipe, options = {}) => {
      const before = current.current,
        next = recipe(before);
      if (next === before) return;
      if (options.history !== false) {
        const grouped =
          options.group &&
          lastGroup.current.key === options.group &&
          Date.now() - lastGroup.current.time < 900;
        if (!grouped) {
          past.current.push(before);
          if (past.current.length > 60) past.current.shift();
        }
        future.current = [];
        lastGroup.current = { key: options.group ?? '', time: Date.now() };
        setHistoryTick((n) => n + 1);
      }
      current.current = { ...next, revision: before.revision };
      setProject(current.current);
      version.current++;
      if (!options.quiet) {
        quietOnly.current = false;
        setStatus('unsaved');
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 650);
    },
    [flush],
  );
  const travel = useCallback(
    (direction: 'undo' | 'redo') => {
      const from = direction === 'undo' ? past : future,
        to = direction === 'undo' ? future : past;
      const target = from.current.pop();
      if (!target) return;
      to.current.push(current.current);
      update((p) => ({ ...target, viewport: p.viewport }), { history: false });
      setHistoryTick((n) => n + 1);
      lastGroup.current = { key: '', time: 0 };
    },
    [update],
  );
  /** Replace this tab's board with the server's copy, dropping unsaved local edits. */
  const takeServerCopy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const fresh = await api<Project>(`/api/projects/${current.current.id}`);
    current.current = fresh;
    lastSaved.current = fresh;
    savedVersion.current = version.current;
    past.current = [];
    future.current = [];
    setProject(fresh);
    setStatus('saved');
    setError('');
    setRefreshed((n) => n + 1);
  }, []);
  // Rule (2026-09-26): the agent talks to the running app. When it writes the board (or another
  // tab does), this tab picks the change up as soon as it has nothing unsaved, instead of failing
  // the next autosave with a conflict. With unsaved edits, the existing conflict message stands.
  useEffect(() => {
    let stopped = false,
      busy = false;
    const check = async () => {
      if (busy || stopped || document.hidden) return;
      busy = true;
      try {
        const list = await api<{ id: string; updatedAt: string }[]>('/api/projects');
        const mine = list.find((entry) => entry.id === current.current.id);
        if (!mine || stopped || mine.updatedAt === current.current.updatedAt) return;
        if (running.current) return;
        const dirty = version.current !== savedVersion.current;
        if (dirty && !onlyViewportChanged(current.current, lastSaved.current)) return;
        const fresh = await api<Project>(`/api/projects/${current.current.id}`);
        if (stopped || running.current || fresh.revision <= current.current.revision) return;
        // A viewport-only local change rides along; anything else was ruled out above.
        current.current = dirty ? { ...fresh, viewport: current.current.viewport } : fresh;
        lastSaved.current = fresh;
        past.current = [];
        future.current = [];
        setProject(current.current);
        if (!dirty) {
          setStatus('saved');
          setError('');
        }
        setRefreshed((n) => n + 1);
      } catch {
        /* the next check will try again */
      } finally {
        busy = false;
      }
    };
    const every = setInterval(() => void check(), 4000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      stopped = true;
      clearInterval(every);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (version.current !== savedVersion.current && !quietOnly.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', unload);
    return () => {
      window.removeEventListener('beforeunload', unload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  void historyTick;
  return {
    project,
    update,
    status,
    error,
    flush,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    undo: () => travel('undo'),
    redo: () => travel('redo'),
    getCurrent: () => current.current,
    /** Counts the times this tab replaced the board with a newer copy from the server. */
    refreshed,
    takeServerCopy,
  };
}
