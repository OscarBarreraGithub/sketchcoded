import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  MapPin,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  emptyProject,
  removeScreen,
  uid,
  type Asset,
  type Project,
  type Transition,
} from '../shared/model';
import { analyze, decisionFor, type Issue } from '../shared/graph';
import { api, exportProject, getProjects } from './api';
import { useProject } from './useProject';
import { Board } from './components/Board';
import { Library } from './components/Library';
import { Modal, Confirm } from './components/Modal';
import { ScreenEditor } from './components/ScreenEditor';
import { EdgeEditor } from './components/EdgeEditor';
import { ReviewPanel } from './components/ReviewPanel';
import { Preview } from './components/Preview';

type ProjectSummary = Awaited<ReturnType<typeof getProjects>>[number];
export default function App() {
  const [project, setProject] = useState<Project | null>(null),
    [projects, setProjects] = useState<ProjectSummary[]>([]),
    [error, setError] = useState('');
  const load = async () => {
    try {
      setError('');
      const list = await getProjects();
      setProjects(list);
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('drawcode:last-board');
      } catch {
        /* optional preference */
      }
      const id = list.find((p) => p.id === saved)?.id ?? list[0]?.id;
      if (!id)
        throw new Error('No project found. Restart the local server to create a starter board.');
      setProject(await api<Project>(`/api/projects/${id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const open = (p: Project) => {
    try {
      localStorage.setItem('drawcode:last-board', p.id);
    } catch {
      /* optional preference */
    }
    setProject(p);
    void getProjects()
      .then(setProjects)
      .catch(() => {});
  };
  if (!project)
    return (
      <div className="boot-screen">
        <Brand />
        <h1>{error ? 'A small snag.' : 'Making room for your ideas…'}</h1>
        {error ? (
          <>
            <p>{error}</p>
            <button className="button primary" onClick={() => void load()}>
              <RefreshCw size={16} /> Try again
            </button>
          </>
        ) : (
          <LoaderCircle className="spin" />
        )}
      </div>
    );
  return <Studio key={project.id} initial={project} projects={projects} onOpen={open} />;
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <span />
      </span>
      <span>
        drawcode<span className="brand-period">.</span>
      </span>
    </div>
  );
}
function Studio({
  initial,
  projects,
  onOpen,
}: {
  initial: Project;
  projects: ProjectSummary[];
  onOpen: (p: Project) => void;
}) {
  const { project, update, status, error, flush, undo, redo, canUndo, canRedo, getCurrent } =
    useProject(initial);
  const [menu, setMenu] = useState(false),
    [modal, setModal] = useState<'folder' | 'new' | 'help' | 'rename' | null>(null),
    [screen, setScreen] = useState<{ id: string; pin?: string } | null>(null),
    [edge, setEdge] = useState<{ draft: Transition; isNew: boolean } | null>(null),
    [preview, setPreview] = useState(false),
    [review, setReview] = useState(false),
    [connecting, setConnecting] = useState<string | null>(null),
    [adding, setAdding] = useState<{ asset: Asset; pos: { x: number; y: number } } | null>(null),
    [remove, setRemove] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [report, setReport] = useState<string[] | null>(null),
    [fitSignal, setFitSignal] = useState(0);
  const [name, setName] = useState(''),
    [folder, setFolder] = useState(''),
    [formError, setFormError] = useState('');
  const importRef = useRef<HTMLInputElement>(null),
    folderInput = useRef<HTMLInputElement>(null),
    scanning = useRef(false),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 6500);
  };
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
  const create = async (demo: boolean) => {
    setFormError('');
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (!(await flush()))
        throw new Error('Save or export this board before opening another one.');
      onOpen(
        await api<Project>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), demo }),
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
    setAdding({ asset, pos: pos ?? { x: (400 - v.x) / v.zoom, y: (230 - v.y) / v.zoom } });
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
  const connect = (pinId: string, target: string) => {
    if (target) newEdge(pinId, target);
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
    else if (issue.rule === 'no-entry' && p.screens[0]) setScreen({ id: p.screens[0].id });
  };
  const newModal = (type: typeof modal) => {
    setMenu(false);
    setFormError('');
    setName(type === 'rename' ? project.name : 'My next idea');
    setModal(type);
  };
  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />
        <div className="header-separator" />
        <div className="project-switcher">
          <button className="project-trigger" onClick={() => setMenu(!menu)} aria-expanded={menu}>
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
            aria-label="How to use Drawcode"
          >
            <CircleHelp size={19} />
          </button>
          <button className="button export-button" onClick={() => void doExport()}>
            <ArrowDownToLine size={16} />
            <span>Export project</span>
          </button>
          <button
            className="button primary"
            disabled={!project.screens.length}
            onClick={() => setPreview(true)}
          >
            <Play size={15} fill="currentColor" /> Test flow
          </button>
        </div>
      </header>
      {error && (
        <div className="save-error" role="alert">
          <span>{error}</span>
          <button className="text-button" onClick={() => void flush()}>
            Retry save
          </button>
          <button className="text-button" onClick={() => void doExport()}>
            Export current work
          </button>
        </div>
      )}
      <div className="studio-layout">
        <Library
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
              >
                <ShieldCheck size={16} /> Review flow{' '}
                <span className={openCount ? 'review-count' : 'review-clear'}>
                  {openCount || <Check size={12} />}
                </span>
              </button>
            </div>
          </div>
          <div className="board-and-review">
            <Board
              project={project}
              update={update}
              onScreen={(id) => setScreen({ id })}
              onEdge={editEdge}
              onAdd={add}
              onConnect={connect}
              connecting={connecting}
              onCancelConnect={() => setConnecting(null)}
              undo={undo}
              redo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              fitSignal={fitSignal}
            />
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
                    entry: p.screens.length === 0,
                    role: 'screen',
                  },
                ],
                layout: { ...p.layout, [id]: { ...adding.pos, width: 320 } },
              }));
              setAdding(null);
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
                placeholder="/Users/you/Pictures/sketches"
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
          <div className="new-board-options">
            <button
              className="new-board-option"
              disabled={busy || !name.trim()}
              onClick={() => void create(false)}
            >
              <FilePlus2 size={26} />
              <strong>A blank board</strong>
              <span>Start with your own sketches.</span>
              <ArrowRight size={17} />
            </button>
            <button
              className="new-board-option"
              disabled={busy || !name.trim()}
              onClick={() => void create(true)}
            >
              <Sparkles size={26} />
              <strong>The chat example</strong>
              <span>Explore a connected idea.</span>
              <ArrowRight size={17} />
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
                'Bring your sketches',
                'Connect a local folder, drop in images, or use the library’s add button.',
              ],
              [
                '02',
                'Make a little space',
                'Drag a sketch onto the board and give it a title. Drag cards to arrange them.',
              ],
              [
                '03',
                'Pin an intention',
                'Click a screen, add a pin, and describe what that part of the UI should do.',
              ],
              [
                '04',
                'Follow the yarn',
                'Click a pin on the board, then a destination screen. Click a yarn to give the connection a summary, conditions, and details. One pin can have many yarns.',
              ],
              [
                '05',
                'Check & play',
                'Review potential dead ends and intentional one-way routes. Keep a reason for each exception. Test flow lets you choose branches and try the sketches.',
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
              <kbd>⌘ / Ctrl</kbd> + scroll to zoom
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
              decisions for your future workflow. No LLM is connected yet.
            </span>
          </div>
        </Modal>
      )}
      {screen && project.screens.some((s) => s.id === screen.id) && (
        <ScreenEditor
          project={project}
          screenId={screen.id}
          initialPin={screen.pin}
          update={update}
          onClose={() => setScreen(null)}
          onConnect={(pin) => {
            setScreen(null);
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
      {preview && project.screens.length > 0 && (
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
