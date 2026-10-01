import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ArrowDownToLine,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  ListTree,
  Images,
  Layers,
  Link2,
  LoaderCircle,
  MapPin,
  Palette,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import {
  attachDetail,
  categoryLabel,
  colorNames,
  colors,
  defaultColorLabels,
  ideaStatus,
  removeScreen,
  setDrawing,
  uid,
  type Asset,
  type PinColor,
  type Project,
  type Transition,
} from '../shared/model';
import { analyze, decisionFor, type Issue } from '../shared/graph';
import { api, exportProject, getProjects } from './api';
import { useProject } from './useProject';
import { Outline } from './components/Outline';
import { Planning } from './components/Planning';
import { Board } from './components/Board';
import { Library } from './components/Library';
import { IdeasPanel } from './components/IdeasPanel';
import { ScrollArea, ScrollHints } from './components/ScrollHints';
import { Modal, Confirm } from './components/Modal';
import { TellAgent } from './components/TellAgent';
import { ScreenEditor } from './components/ScreenEditor';
import { EdgeEditor } from './components/EdgeEditor';
import { ReviewPanel } from './components/ReviewPanel';
import { Preview } from './components/Preview';
import { Brand } from './components/Brand';
import { Landing } from './components/Landing';

type ProjectSummary = Awaited<ReturnType<typeof getProjects>>[number];
type Route = { kind: 'landing' } | { kind: 'board'; id: string };
/** `/` is the landing page with your boards; `/board/<id>` is the workstation. */
const readRoute = (): Route => {
  const m = window.location.pathname.match(/^\/board\/([A-Za-z0-9_-]+)\/?$/);
  return m ? { kind: 'board', id: m[1] } : { kind: 'landing' };
};
export default function App() {
  const [route, setRoute] = useState<Route>(readRoute),
    [project, setProject] = useState<Project | null>(null),
    [projects, setProjects] = useState<ProjectSummary[]>([]),
    [error, setError] = useState(''),
    [lastId, setLastId] = useState<string | null>(() => {
      try {
        return localStorage.getItem('drawcode:last-board');
      } catch {
        return null;
      }
    });
  const refresh = () =>
    getProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message));
  const beforeLeave = useRef<(() => Promise<boolean>) | null>(null);
  const activePath = useRef(window.location.pathname);
  const navigation = useRef(0);
  const registerSave = useCallback((save: () => Promise<boolean>) => {
    beforeLeave.current = save;
    return () => {
      if (beforeLeave.current === save) beforeLeave.current = null;
    };
  }, []);
  const navigate = useCallback(async (next: Route, fromHistory = false) => {
    const ticket = ++navigation.current;
    const path = next.kind === 'board' ? `/board/${next.id}` : '/';
    if (path === activePath.current) return;
    const saved = !beforeLeave.current || (await beforeLeave.current());
    if (ticket !== navigation.current) return;
    if (!saved) {
      // popstate changes the address before we can save. Keep the board and its recovery UI.
      if (fromHistory) window.history.pushState(null, '', activePath.current);
      return;
    }
    if (!fromHistory && window.location.pathname !== path) window.history.pushState(null, '', path);
    activePath.current = path;
    setRoute(next);
  }, []);
  const go = (next: Route) => {
    void navigate(next);
  };
  useEffect(() => {
    void refresh();
    const back = () => {
      void navigate(readRoute(), true);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [navigate]);
  useEffect(() => {
    if (route.kind === 'landing') {
      setProject(null);
      void refresh();
      return;
    }
    let stale = false;
    setError('');
    api<Project>(`/api/projects/${route.id}`)
      .then((p) => {
        if (stale) return;
        try {
          localStorage.setItem('drawcode:last-board', p.id);
        } catch {
          /* optional preference */
        }
        setLastId(p.id);
        setProject(p);
      })
      .catch((e: Error) => {
        if (stale) return;
        setError(`That board could not be opened: ${e.message}`);
        go({ kind: 'landing' });
      });
    return () => {
      stale = true;
    };
  }, [route]);
  const open = (p: Project) => {
    setProject(p);
    go({ kind: 'board', id: p.id });
  };
  const create = async (name: string) => {
    const made = await api<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    open(made);
  };
  if (route.kind === 'landing')
    return (
      <Landing
        boards={projects}
        lastId={lastId}
        error={error}
        onOpen={(id) => go({ kind: 'board', id })}
        onCreate={create}
      />
    );
  if (!project || project.id !== route.id)
    return (
      <div className="boot-screen">
        <Brand />
        <h1>Making room for your ideas…</h1>
        <LoaderCircle className="spin" />
      </div>
    );
  return (
    <Studio
      key={project.id}
      initial={project}
      projects={projects}
      onOpen={open}
      onHome={() => go({ kind: 'landing' })}
      registerSave={registerSave}
    />
  );
}
function Studio({
  initial,
  projects,
  onOpen,
  onHome,
  registerSave,
}: {
  initial: Project;
  projects: ProjectSummary[];
  onOpen: (p: Project) => void;
  onHome: () => void;
  registerSave: (save: () => Promise<boolean>) => () => void;
}) {
  const {
    project,
    update,
    status,
    error,
    flush,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrent,
    refreshed,
    takeServerCopy,
  } = useProject(initial);
  useEffect(() => registerSave(flush), [registerSave, flush]);
  const [menu, setMenu] = useState(false),
    [modal, setModal] = useState<'folder' | 'new' | 'help' | 'rename' | 'categories' | null>(null),
    // Looking at one category of yarn at a time, so the board shows one kind of journey.
    [category, setCategory] = useState<PinColor | null>(null),
    [categoryMenu, setCategoryMenu] = useState(false),
    [screen, setScreen] = useState<{ id: string; pin?: string; idea?: string } | null>(null),
    [edge, setEdge] = useState<{ draft: Transition; isNew: boolean } | null>(null),
    [preview, setPreview] = useState(false),
    [review, setReview] = useState(false),
    [viewMode, setViewMode] = useState<'board' | 'outline' | 'planning'>('board'),
    [libraryOpen, setLibraryOpen] = useState(false),
    [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number } | null>(null),
    [connecting, setConnecting] = useState<string | null>(null),
    [adding, setAdding] = useState<{ asset: Asset; pos: { x: number; y: number } } | null>(null),
    [remove, setRemove] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [report, setReport] = useState<string[] | null>(null),
    [fitSignal, setFitSignal] = useState(0),
    [boardsPrompt, setBoardsPrompt] = useState(0);
  const [name, setName] = useState(''),
    [folder, setFolder] = useState(''),
    [formError, setFormError] = useState('');
  const importRef = useRef<HTMLInputElement>(null),
    leftScroll = useRef<HTMLDivElement>(null),
    folderInput = useRef<HTMLInputElement>(null),
    scanning = useRef(false),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 6500);
  };
  useEffect(() => {
    if (refreshed) notify('Updated from your agent. The board refreshed with the newest copy.');
  }, [refreshed]);
  const issues = useMemo(
      () => analyze(project),
      [project.assets, project.screens, project.pins, project.transitions, project.layout],
    ),
    openCount = issues.filter((i) => decisionFor(i, project.reviews).status !== 'accepted').length;
  useEffect(() => {
    if (initial.revision > 1) return;
    const t = setTimeout(() => setFitSignal((n) => n + 1), 120);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest('input,textarea,select,dialog') || e.target.isContentEditable)
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === 'Escape') {
        setMenu(false);
        setConnecting(null);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const merge = (incoming: Asset[], connectedFolder?: string) => {
    const unique = new Map(getCurrent().assets.map((a) => [a.id, a]));
    let added = 0;
    incoming.forEach((a) => {
      if (!unique.has(a.id)) {
        unique.set(a.id, a);
        added++;
      }
    });
    const current = getCurrent();
    if (added || (connectedFolder && !current.folders.includes(connectedFolder)))
      update((p) => ({
        ...p,
        assets: [...unique.values()],
        folders: connectedFolder ? [...new Set([...p.folders, connectedFolder])] : p.folders,
      }));
    return added;
  };
  const importImages = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    let added = 0;
    const warnings: string[] = [];
    try {
      for (let i = 0; i < files.length; i += 40) {
        const data = new FormData();
        files.slice(i, i + 40).forEach((file) => data.append('images', file));
        const result = await api<{ assets: Asset[]; warnings: string[] }>('/api/images', {
          method: 'POST',
          body: data,
        });
        added += merge(result.assets);
        warnings.push(...result.warnings);
      }
      notify(
        added
          ? `${added} new ${added === 1 ? 'sketch' : 'sketches'} in your library.`
          : 'These sketches are already in the library.',
      );
      if (warnings.length) setReport(warnings);
    } catch (e) {
      setReport([(e as Error).message, ...warnings]);
    } finally {
      setBusy(false);
    }
  };
  const scan = async (paths: string[], silent = false) => {
    if (scanning.current) return;
    scanning.current = true;
    if (!silent) setBusy(true);
    let added = 0;
    const warnings: string[] = [];
    try {
      for (const path of paths) {
        const result = await api<{ assets: Asset[]; warnings: string[]; folder: string }>(
          '/api/folders/scan',
          { method: 'POST', body: JSON.stringify({ folder: path }) },
        );
        added += merge(result.assets, result.folder);
        warnings.push(...result.warnings);
      }
      if (!silent || added)
        notify(
          added
            ? `${added} new ${added === 1 ? 'sketch' : 'sketches'} added. Existing board images stay in place.`
            : 'Your library is up to date.',
        );
      if (warnings.length && !silent) setReport(warnings);
      setFormError('');
      return true;
    } catch (e) {
      if (!silent) setFormError((e as Error).message);
      else setNotice(`Folder refresh paused: ${(e as Error).message}`);
      return false;
    } finally {
      scanning.current = false;
      if (!silent) setBusy(false);
    }
  };
  useEffect(() => {
    if (!project.folders.length) return;
    const interval = setInterval(() => void scan(getCurrent().folders, true), 20000);
    return () => clearInterval(interval);
  }, [project.folders.join('|')]);
  const openBoard = async (id: string) => {
    setMenu(false);
    if (!(await flush())) return;
    try {
      onOpen(await api<Project>(`/api/projects/${id}`));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const create = async () => {
    setFormError('');
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (!(await flush()))
        throw new Error('Save or export this board before opening another one.');
      onOpen(
        await api<Project>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim() }),
        }),
      );
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const bundleImport = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      if (!(await flush()))
        throw new Error('Save or export this board before importing another one.');
      const data = new FormData();
      data.append('project', file);
      onOpen(await api<Project>('/api/import', { method: 'POST', body: data }));
    } catch (e) {
      setReport([(e as Error).message]);
    } finally {
      setBusy(false);
    }
  };
  const doExport = async () => {
    try {
      await exportProject(getCurrent());
      notify('Project exported with sketches, graph, and review decisions.');
    } catch (e) {
      setReport([(e as Error).message]);
    }
  };
  const add = (asset: Asset, pos?: { x: number; y: number }) => {
    const v = getCurrent().viewport;
    setName(
      asset.name
        .replace(/\.[^.]+$/, '')
        .replace(/^\d+[-_]/, '')
        .replace(/[-_]/g, ' '),
    );
    const placements = Object.values(getCurrent().layout);
    const next = placements.length
      ? {
          x: Math.max(...placements.map((p) => p.x + p.width)) + 100,
          y: Math.min(...placements.map((p) => p.y)),
        }
      : { x: (400 - v.x) / v.zoom, y: (230 - v.y) / v.zoom };
    setAdding({ asset, pos: pos ?? next });
  };
  const newEdge = (
    pinId: string,
    target: string | null,
    navigation: Transition['navigation'] = 'push',
  ) => {
    setScreen(null);
    setConnecting(null);
    setEdge({
      isNew: true,
      draft: {
        id: uid(),
        pinId,
        target,
        summary: navigation === 'back' ? 'Go back' : '',
        condition: '',
        logic: '',
        context: '',
        fallback: false,
        navigation,
        color: 'red',
      },
    });
  };
  const showOnBoard = (id: string) => {
    setViewMode('board');
    setLibraryOpen(false);
    setFocusRequest({ id, nonce: Date.now() });
  };
  const nextPosition = () => {
    const current = getCurrent(),
      placements = Object.values(current.layout),
      v = current.viewport;
    return placements.length
      ? {
          x: Math.max(...placements.map((p) => p.x + p.width)) + 100,
          y: Math.min(...placements.map((p) => p.y)),
        }
      : { x: (400 - v.x) / v.zoom, y: (230 - v.y) / v.zoom };
  };
  // A planned frame: a screen with a title and ideas, drawn later.
  const planScreen = (title: string, purpose: string) => {
    const id = uid(),
      pos = nextPosition();
    update((p) => ({
      ...p,
      screens: [
        ...p.screens,
        {
          id,
          assetId: null,
          title,
          purpose,
          entry: !p.screens.some((s) => s.role !== 'detail'),
          role: 'screen',
        },
      ],
      layout: { ...p.layout, [id]: { ...pos, width: 320 } },
    }));
    notify(`${title} is planned. Assign ideas to it, then drop a sketch onto its frame.`);
  };
  const attachDrawing = (screenId: string, asset: Asset) => {
    const before = getCurrent();
    update((p) => setDrawing(p, screenId, 'web', asset.id));
    if (getCurrent() !== before) {
      notify('Drawing added. Open the frame to place its planned ideas as pins.');
      showOnBoard(screenId);
    }
  };
  const placeIdeaOnDrawing = (ideaId: string) => {
    const idea = getCurrent().ideas.find((idea) => idea.id === ideaId);
    if (idea?.screenId) setScreen({ id: idea.screenId, idea: ideaId });
  };
  const waitingIdeas = project.ideas.filter((idea) => ideaStatus(idea) === 'assigned').length;
  const connect = (pinId: string, target: string) => {
    setViewMode('board');
    if (target && getCurrent().pins.find((pin) => pin.id === pinId)?.kind === 'detail') {
      const p = getCurrent();
      if (p.pins.find((pin) => pin.id === pinId)?.screenId === target) {
        notify('Choose a different sketch for this closer look.');
        return;
      }
      update((p) => attachDetail(p, pinId, target));
      setConnecting(null);
      notify('Detail attached. This reference keeps you on the same app screen.');
    } else if (target && getCurrent().screens.find((s) => s.id === target)?.role === 'detail') {
      notify(
        'This is a detail sketch. Choose Detail reference in the pin editor to attach it, or select an app screen.',
      );
    } else if (target) newEdge(pinId, target);
    else {
      setScreen(null);
      setConnecting(pinId === connecting ? null : pinId);
    }
  };
  const editEdge = (id: string) => {
    const draft = getCurrent().transitions.find((t) => t.id === id);
    if (draft) {
      setScreen(null);
      setEdge({ draft, isNew: false });
    }
  };
  const locate = (issue: Issue) => {
    const id = issue.subjects[0],
      p = getCurrent(),
      s = p.screens.find((s) => s.id === id),
      pin = p.pins.find((pin) => pin.id === id),
      t = p.transitions.find((t) => t.id === id);
    if (t) editEdge(t.id);
    else if (s) setScreen({ id: s.id });
    else if (pin) setScreen({ id: pin.screenId, pin: pin.id });
    else if (issue.rule === 'no-entry') {
      const first = p.screens.find((s) => s.role !== 'detail');
      if (first) setScreen({ id: first.id });
    }
  };
  const newModal = (type: typeof modal) => {
    setMenu(false);
    setFormError('');
    setName(type === 'rename' ? project.name : 'My next idea');
    setModal(type);
  };
  return (
    <div className={`app-shell ${libraryOpen ? 'library-open' : ''}`}>
      <header className="app-header">
        <button className="brand-link" onClick={onHome} aria-label="Back to your boards">
          <Brand />
        </button>
        <div className="header-separator" />
        <div className="project-switcher">
          <button
            className="project-trigger"
            aria-label={`Boards: ${project.name}`}
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
          >
            <FolderOpen size={16} />
            <span>{project.name}</span>
            <ChevronDown size={14} />
          </button>
          {menu && (
            <>
              <button
                className="menu-scrim"
                aria-label="Close board menu"
                onClick={() => setMenu(false)}
              />
              <div className="project-menu">
                <span className="eyebrow">YOUR BOARDS</span>
                {projects.map((p) => (
                  <button key={p.id} onClick={() => void openBoard(p.id)}>
                    <LayoutDashboard size={15} />
                    <span>
                      {p.id === project.id ? project.name : p.name}
                      <small>{p.screenCount} screens</small>
                    </span>
                    {p.id === project.id && <Check size={15} />}
                  </button>
                ))}
                <hr />
                <button onClick={() => newModal('new')}>
                  <Plus size={16} /> New board
                </button>
                <button
                  onClick={() => {
                    setMenu(false);
                    setBoardsPrompt((n) => n + 1);
                  }}
                >
                  <Bot size={16} /> New board with your agent
                </button>
                <button
                  onClick={() => {
                    setMenu(false);
                    importRef.current?.click();
                  }}
                >
                  <Upload size={16} /> Import a project
                </button>
                <button onClick={() => newModal('help')}>
                  <CircleHelp size={16} /> How it works
                </button>
              </div>
            </>
          )}
        </div>
        <TellAgent
          project={project}
          context={{ view: 'boards' }}
          openSignal={boardsPrompt}
          hideButton
        />
        <div
          className={`save-status ${status}`}
          title={error || 'Projects save automatically to your computer'}
        >
          {status === 'saving' ? (
            <LoaderCircle size={12} className="spin" />
          ) : status === 'saved' ? (
            <span className="local-dot" />
          ) : (
            <span className="unsaved-dot" />
          )}
          <span>
            {status === 'saved'
              ? 'All changes saved'
              : status === 'saving'
                ? 'Saving…'
                : status === 'error'
                  ? 'Save needs attention'
                  : 'Unsaved changes'}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="icon-button help-button"
            onClick={() => newModal('help')}
            aria-label="How to use Sketchcoded"
          >
            <CircleHelp size={19} />
          </button>
          <button className="button export-button" onClick={() => void doExport()}>
            <ArrowDownToLine size={16} />
            <span>Export project</span>
          </button>
          <button
            className="button primary test-button"
            aria-label="Test flow"
            disabled={!project.screens.some((s) => s.role !== 'detail')}
            onClick={() => setPreview(true)}
          >
            <Play size={15} fill="currentColor" /> <span>Test flow</span>
          </button>
        </div>
      </header>
      {error && (
        <div className="save-error" role="alert">
          <span>{error}</span>
          <button className="text-button" onClick={() => void flush()}>
            Retry save
          </button>
          <button className="text-button" onClick={() => void takeServerCopy()}>
            Take the newer copy
          </button>
          <button className="text-button" onClick={() => void doExport()}>
            Export current work
          </button>
        </div>
      )}
      <div className="studio-layout">
        <div className="left-column">
          <div className="left-scroll" ref={leftScroll}>
            <Library
              onLocate={showOnBoard}
              onClose={() => setLibraryOpen(false)}
              project={project}
              onImport={(files) => void importImages(files)}
              onFolder={() => {
                setFormError('');
                setModal('folder');
              }}
              onRefresh={() =>
                void scan(project.folders).then((ok) => {
                  if (!ok)
                    notify('Could not refresh a folder. Open Connect a folder to check the path.');
                })
              }
              onDisconnect={(folder) =>
                update((p) => ({ ...p, folders: p.folders.filter((f) => f !== folder) }))
              }
              onAdd={(a) => add(a)}
              busy={busy}
            />
            <IdeasPanel
              project={project}
              onOpenPlan={() => {
                setViewMode('planning');
                setLibraryOpen(false);
              }}
              onPlace={placeIdeaOnDrawing}
              onScreen={(id) => setScreen({ id })}
            />
          </div>
          <ScrollHints target={leftScroll} label="More" />
        </div>
        <button
          className="library-scrim"
          aria-label="Close sketch library overlay"
          onClick={() => setLibraryOpen(false)}
        />
        <section className="studio-main">
          <div className="workspace-header">
            <div>
              <div className="board-eyebrow">
                <span>THE WORKING BOARD</span>
                <span className="board-local">LOCAL PROJECT</span>
              </div>
              <div className="board-title">
                <h1>{project.name}</h1>
                <button
                  className="icon-button"
                  aria-label="Rename board"
                  onClick={() => newModal('rename')}
                >
                  <Pencil size={15} />
                </button>
              </div>
              <p>Loose sketches. Connected thoughts. Something taking shape.</p>
            </div>
            <div className="board-summary">
              <div className="board-counts">
                <span>
                  <LayoutDashboard size={14} />
                  {project.screens.length} screens
                </span>
                <span>
                  <Link2 size={14} />
                  {project.transitions.length} yarns
                </span>
              </div>
              <button
                className={`button review-button ${review ? 'selected' : ''}`}
                onClick={() => setReview(!review)}
                aria-expanded={review}
                aria-describedby="review-explanation"
              >
                <ShieldCheck size={16} /> Review flow{' '}
                <span className={openCount ? 'review-count' : 'review-clear'}>
                  {openCount || <Check size={12} />}
                </span>
              </button>
            </div>
          </div>
          <div className="view-toolbar">
            <div className="view-switch" role="group" aria-label="Workspace view">
              <button
                aria-label="Board"
                aria-pressed={viewMode === 'board'}
                onClick={() => setViewMode('board')}
              >
                <LayoutDashboard size={17} /> Board
              </button>
              <button
                aria-label="App outline"
                aria-pressed={viewMode === 'outline'}
                onClick={() => {
                  setViewMode('outline');
                  setConnecting(null);
                }}
              >
                <ListTree size={18} /> App outline
              </button>
              <button
                aria-label="Plan"
                aria-pressed={viewMode === 'planning'}
                onClick={() => {
                  setViewMode('planning');
                  setConnecting(null);
                }}
              >
                <ListChecks size={18} /> Plan
                {waitingIdeas > 0 && <span className="view-badge">{waitingIdeas}</span>}
              </button>
            </div>
            <div className="category-control">
              <button
                aria-label={category ? `Threads: ${categoryLabel(project, category)}` : 'Threads'}
                className={`button category-button ${category ? 'filtering' : ''}`}
                aria-expanded={categoryMenu}
                aria-haspopup="menu"
                onClick={() => setCategoryMenu((open) => !open)}
              >
                {category ? (
                  <i className="category-dot" style={{ background: colors[category] }} />
                ) : (
                  <Palette size={16} />
                )}
                {category ? categoryLabel(project, category) : 'Threads'}
                <ChevronDown size={14} />
              </button>
              {categoryMenu && (
                <>
                  <button
                    className="menu-scrim"
                    aria-label="Close the thread menu"
                    onClick={() => setCategoryMenu(false)}
                  />
                  <div className="project-menu category-menu" role="menu">
                    <button
                      aria-pressed={!category}
                      onClick={() => {
                        setCategory(null);
                        setCategoryMenu(false);
                      }}
                    >
                      <Layers size={15} /> All threads
                      <span>{project.transitions.length}</span>
                    </button>
                    {colorNames.map((c) => {
                      const count = project.transitions.filter((t) => t.color === c).length;
                      if (!count && !project.colorLabels?.[c]) return null;
                      return (
                        <button
                          key={c}
                          aria-pressed={category === c}
                          onClick={() => {
                            setCategory(c);
                            setViewMode('board');
                            setCategoryMenu(false);
                          }}
                        >
                          <i className="category-dot" style={{ background: colors[c] }} />
                          {categoryLabel(project, c)}
                          <span>{count}</span>
                        </button>
                      );
                    })}
                    <button
                      className="menu-more"
                      onClick={() => {
                        setCategoryMenu(false);
                        setModal('categories');
                      }}
                    >
                      <SlidersHorizontal size={15} /> Name and add categories
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              aria-label="Sketch library"
              className="button library-toggle"
              onClick={() => setLibraryOpen(true)}
            >
              <Images size={17} /> Sketch library
            </button>
            {viewMode === 'board' && <TellAgent project={project} context={{ view: 'board' }} />}
            <button
              className="icon-button compact-workspace-action"
              aria-label="Review flow"
              aria-expanded={review}
              onClick={() => setReview(!review)}
            >
              <ShieldCheck size={18} />
            </button>
            <button
              className="icon-button compact-workspace-action"
              aria-label="Rename board"
              onClick={() => newModal('rename')}
            >
              <Pencil size={18} />
            </button>
            <p id="review-explanation">Review flow finds missing paths and ways back.</p>
          </div>
          <div className="board-and-review">
            {viewMode === 'planning' ? (
              <ScrollArea label="More of the plan">
                <Planning
                  project={project}
                  update={update}
                  onScreen={(id) => setScreen({ id })}
                  onPin={(id, pin) => setScreen({ id, pin })}
                  onPlace={placeIdeaOnDrawing}
                  onBoard={showOnBoard}
                  onPlanScreen={planScreen}
                />
              </ScrollArea>
            ) : viewMode === 'outline' ? (
              <ScrollArea label="More screens">
                <Outline
                  project={project}
                  onScreen={(id) => setScreen({ id })}
                  onPin={(id, pin) => setScreen({ id, pin })}
                  onEdge={editEdge}
                  onBoard={showOnBoard}
                />
              </ScrollArea>
            ) : (
              <Board
                project={project}
                update={update}
                onScreen={(id, pin) => setScreen({ id, pin })}
                onEdge={editEdge}
                onAdd={add}
                onAttachDrawing={attachDrawing}
                onConnect={connect}
                connecting={connecting}
                onCancelConnect={() => setConnecting(null)}
                undo={undo}
                redo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                category={category}
                fitSignal={fitSignal}
                focusRequest={focusRequest}
                onFocusHandled={() => setFocusRequest(null)}
              />
            )}
            {review && (
              <ReviewPanel
                project={project}
                update={update}
                onClose={() => setReview(false)}
                onLocate={locate}
              />
            )}
          </div>
        </section>
      </div>
      <input
        ref={importRef}
        hidden
        type="file"
        accept=".zip"
        onChange={(e) => {
          void bundleImport(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button
            className="icon-button"
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {adding && (
        <Modal title="Give this sketch a name." onClose={() => setAdding(null)}>
          <p className="muted">A little paper title to make it feel at home on your board.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              const id = uid();
              update((p) => ({
                ...p,
                screens: [
                  ...p.screens,
                  {
                    id,
                    assetId: adding.asset.id,
                    title: name.trim(),
                    purpose: '',
                    entry: !p.screens.some((s) => s.role !== 'detail'),
                    role: 'screen',
                  },
                ],
                layout: { ...p.layout, [id]: { ...adding.pos, width: 320 } },
              }));
              setAdding(null);
              showOnBoard(id);
              notify('Pinned to the board. Click the sketch to add interactions.');
            }}
          >
            <label>
              Screen title
              <input
                autoFocus
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Your people"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="button" onClick={() => setAdding(null)}>
                Cancel
              </button>
              <button type="submit" className="button primary">
                <MapPin size={16} /> Pin to board
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === 'folder' && (
        <Modal title="A home for your sketches." onClose={() => setModal(null)}>
          <p className="muted">
            Connect a folder on this computer. New and changed images appear in your library every
            20 seconds. Your existing board keeps its original sketches.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await scan([folder.trim()])) setModal(null);
            }}
          >
            <label>
              Local folder path
              <input
                autoFocus
                required
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="Full path to your sketches folder"
              />
            </label>
            <p className="field-help">
              Tip: drag a folder from Finder into a terminal to copy its full path.
            </p>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="button" onClick={() => folderInput.current?.click()}>
                <Upload size={15} /> Import folder once
              </button>
              <button className="button primary" disabled={busy} type="submit">
                {busy ? <LoaderCircle className="spin" size={16} /> : <FolderOpen size={16} />}{' '}
                Connect folder
              </button>
            </div>
          </form>
          <input
            ref={folderInput}
            hidden
            type="file"
            multiple
            {...{ webkitdirectory: '' }}
            onChange={(e) => {
              void importImages(Array.from(e.target.files ?? []));
              e.target.value = '';
              setModal(null);
            }}
          />
          <div className="modal-note">
            PNG, JPEG, WebP, GIF, AVIF, TIFF & SVG · up to 25 MB per image.
            <br />
            Everything stays on your computer.
          </div>
        </Modal>
      )}
      {modal === 'new' && (
        <Modal title="Make room for a new idea." onClose={() => setModal(null)}>
          <label>
            Board name
            <input
              autoFocus
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <div className="modal-actions">
            <button
              className="button primary"
              disabled={busy || !name.trim()}
              onClick={() => void create()}
            >
              <FilePlus2 size={17} /> Create the board
            </button>
          </div>
        </Modal>
      )}
      {modal === 'categories' && (
        <Modal
          title="What the threads mean."
          onClose={() => setModal(null)}
          className="category-modal"
        >
          <p className="field-help">
            A color is a category of yarn. Name them however you think about this app; the board’s
            legend and your agent both read these names. A category with no name and no yarn stays
            out of the way until you use it.
          </p>
          <div className="category-rows">
            {colorNames.map((c) => {
              const count = project.transitions.filter((t) => t.color === c).length;
              return (
                <label key={c} className="category-row">
                  <i className="category-dot" style={{ background: colors[c] }} />
                  <input
                    aria-label={`Name for the ${c} threads`}
                    maxLength={60}
                    placeholder={defaultColorLabels[c] || 'Name this category'}
                    value={project.colorLabels?.[c] ?? ''}
                    onChange={(e) =>
                      update(
                        (p) => ({
                          ...p,
                          colorLabels: { ...p.colorLabels, [c]: e.target.value },
                        }),
                        { group: `category:${c}` },
                      )
                    }
                  />
                  <small>
                    {count} {count === 1 ? 'thread' : 'threads'}
                  </small>
                </label>
              );
            })}
          </div>
          <div className="modal-actions">
            <button
              className="button"
              onClick={() =>
                update((p) => ({ ...p, colorLabels: { ...defaultColorLabels, ...p.colorLabels } }))
              }
            >
              Use the usual four
            </button>
            <button className="button primary" onClick={() => setModal(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
      {modal === 'rename' && (
        <Modal title="What’s this idea called?" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                update((p) => ({ ...p, name: name.trim() }));
                setModal(null);
              }
            }}
          >
            <label>
              Board name
              <input
                autoFocus
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button className="button primary">
                Save name <Check size={15} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === 'help' && (
        <Modal
          title="From a sketch to a story."
          onClose={() => setModal(null)}
          className="help-modal"
        >
          <p className="muted">A bulletin board for thinking through your next app.</p>
          <div className="help-steps">
            {[
              [
                '01',
                'Plan first, if you like',
                'Open Plan and write down every idea for the app. The Ideas panel beside the library shows what is still left to place. Assign each one to a screen, even a frame you have not drawn yet. Placing an idea later turns it into a pin with its text already written.',
              ],
              [
                '02',
                'Bring your sketches',
                'Connect a folder on this computer, drop in image files, or use the library’s add button.',
              ],
              [
                '03',
                'Make a little space',
                'Drag a sketch onto the board and give it a title, or drop it onto a planned frame. A screen can hold a web drawing and a mobile drawing of the same view. Use App outline to read the screens and paths as a directory.',
              ],
              [
                '04',
                'Pin an intention',
                'Click a screen to open it, add a pin, and describe what that part of the UI should do. Place each pin on the mobile drawing too. Choose Detail reference to attach a closer look without adding an app navigation step.',
              ],
              [
                '05',
                'Follow the yarn',
                'Click a pin on the board, then a destination screen. Click a yarn to give the connection a summary, conditions, and details. One pin can have many yarns.',
              ],
              [
                '06',
                'Check & play',
                'Review potential dead ends and intentional one-way routes. Keep a reason for each exception. Test flow lets you choose branches, switch between web and mobile, and try the sketches.',
              ],
              [
                '07',
                'Hand it to your agent',
                'Every view has a Tell the agent button. It copies a prompt naming exactly what you are looking at, with the brief, the skills and your rules served by this running app, so your agent reads the board itself and writes back through the same local API.',
              ],
            ].map(([n, title, detail]) => (
              <div key={n}>
                <span>{n}</span>
                <section>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </section>
              </div>
            ))}
          </div>
          <div className="shortcut-list">
            <span>
              <kbd>Space</kbd> + drag to pan
            </span>
            <span>
              Scroll to zoom · <kbd>Shift</kbd> + scroll to pan
            </span>
            <span>
              <kbd>F</kbd> fit board
            </span>
            <span>
              <kbd>⌘ / Ctrl Z</kbd> undo
            </span>
          </div>
          <div className="modal-note">
            <BookOpen size={17} />
            <span>
              Projects auto-save locally. Export includes your images, a versioned graph, and review
              decisions for your future workflow. Your agent checks the full build checklist on
              rendered board views and AI pages, and on the finished site when it builds one. Review
              flow checks structure. No LLM is connected yet.
            </span>
          </div>
        </Modal>
      )}
      {screen && project.screens.some((s) => s.id === screen.id) && (
        <ScreenEditor
          project={project}
          screenId={screen.id}
          initialPin={screen.pin}
          initialIdea={screen.idea}
          update={update}
          onClose={() => setScreen(null)}
          onConnect={(pin) => {
            setScreen(null);
            setViewMode('board');
            setConnecting(pin);
          }}
          onEdge={editEdge}
          onHistory={(pin) => newEdge(pin, null, 'back')}
          onDelete={() => setRemove(screen.id)}
        />
      )}
      {edge && (
        <EdgeEditor
          project={project}
          edge={edge.draft}
          isNew={edge.isNew}
          onClose={() => setEdge(null)}
          onSave={(draft) => {
            update((p) => ({
              ...p,
              transitions: edge.isNew
                ? [...p.transitions, draft]
                : p.transitions.map((t) => (t.id === draft.id ? draft : t)),
            }));
            setEdge(null);
            notify(edge.isNew ? 'A new thread in your idea.' : 'Connection updated.');
          }}
          onDelete={() => {
            update((p) => ({
              ...p,
              transitions: p.transitions.filter((t) => t.id !== edge.draft.id),
            }));
            setEdge(null);
            notify('Yarn removed. Undo is available on the board.');
          }}
        />
      )}
      {remove && (
        <Confirm
          title="Take this screen off the board?"
          detail="Its pins and all incoming and outgoing yarns will be removed. The sketch stays in your library. You can undo this."
          onClose={() => setRemove(null)}
          onConfirm={() => {
            update((p) => removeScreen(p, remove));
            setScreen(null);
          }}
        />
      )}
      {preview && project.screens.some((s) => s.role !== 'detail') && (
        <Preview project={project} onClose={() => setPreview(false)} />
      )}
      {report && (
        <Modal title="Import & export notes" onClose={() => setReport(null)}>
          <div className="import-report">
            {report.map((message, i) => (
              <p key={i}>{message}</p>
            ))}
          </div>
          <div className="modal-actions">
            <button className="button primary" onClick={() => setReport(null)}>
              Got it
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
