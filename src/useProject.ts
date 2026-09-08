import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '../shared/model';
import { api } from './api';
export type Update = (
  recipe: (project: Project) => Project,
  options?: { history?: boolean; group?: string },
) => void;
export function useProject(initial: Project) {
  const [project, setProject] = useState(initial),
    current = useRef(initial);
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved'),
    [error, setError] = useState('');
  const version = useRef(0),
    savedVersion = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    running = useRef<Promise<boolean> | null>(null);
  const past = useRef<Project[]>([]),
    future = useRef<Project[]>([]),
    lastGroup = useRef({ key: '', time: 0 });
  const [historyTick, setHistoryTick] = useState(0);
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    if (running.current) {
      const ok = await running.current;
      return ok && savedVersion.current !== version.current ? flush() : ok;
    }
    if (savedVersion.current === version.current) return true;
    const save = async () => {
      setStatus('saving');
      try {
        while (savedVersion.current !== version.current) {
          const snapshot = current.current,
            atVersion = version.current;
          const saved = await api<Project>(`/api/projects/${snapshot.id}`, {
            method: 'PUT',
            body: JSON.stringify(snapshot),
          });
          current.current = {
            ...current.current,
            revision: saved.revision,
            updatedAt: saved.updatedAt,
          };
          setProject(current.current);
          savedVersion.current = atVersion;
        }
        setStatus('saved');
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
      setStatus('unsaved');
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
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (version.current !== savedVersion.current) {
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
  };
}
