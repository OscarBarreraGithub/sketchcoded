import { TellAgent } from './TellAgent';
import { useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  FileImage,
  FolderOpen,
  ImagePlus,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { assetUrl, type Asset, type Project } from '../../shared/model';
/** The sketch library: New sketches wait at the top; a sketch moves to Used when it lands on the board. */
export function Library({
  project,
  onImport,
  onFolder,
  onRefresh,
  onDisconnect,
  onAdd,
  busy,
  onLocate,
  onClose,
}: {
  project: Project;
  onImport: (files: File[]) => void;
  onFolder: () => void;
  onRefresh: () => void;
  onDisconnect: (folder: string) => void;
  onAdd: (asset: Asset) => void;
  busy: boolean;
  onLocate: (screenId: string) => void;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    [query, setQuery] = useState(''),
    [drag, setDrag] = useState(false),
    [expandedAsset, setExpandedAsset] = useState<string | null>(null),
    [openNew, setOpenNew] = useState(true),
    [openUsed, setOpenUsed] = useState<boolean | null>(null);
  const usedBy = (a: Asset) =>
    project.screens.filter((s) => s.assetId === a.id || s.mobileAssetId === a.id);
  const matches = (a: Asset) => a.name.toLowerCase().includes(query.toLowerCase());
  const fresh = project.assets.filter((a) => matches(a) && !usedBy(a).length),
    used = project.assets.filter((a) => matches(a) && usedBy(a).length);
  const usedOpen = openUsed ?? fresh.length === 0;
  const card = (a: Asset, index: number) => {
    const placements = usedBy(a);
    return (
      <div
        className="asset"
        draggable
        key={a.id}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/drawcode-asset', a.id);
          e.dataTransfer.effectAllowed = 'copy';
        }}
      >
        <button
          className="asset-preview"
          onClick={() => onAdd(a)}
          title="Add this sketch to the board"
          aria-label={`Add ${a.name} to board`}
        >
          <img src={assetUrl(a)} alt={a.name} draggable={false} loading="lazy" />
          <span className="asset-add">
            <Plus size={18} />
          </span>
          {placements.length > 0 && (
            <span className="asset-used">
              ✓ Used {placements.length > 1 ? `${placements.length} times` : ''}
            </span>
          )}
        </button>
        <div className="asset-caption">
          <span className="asset-number">{String(index + 1).padStart(2, '0')}</span>
          <span title={a.name}>
            {a.name
              .replace(/\.[^.]+$/, '')
              .replace(/^\d+[-_]/, '')
              .replace(/[-_]/g, ' ')}
          </span>
          <FileImage size={13} />
        </div>
        {placements.length ? (
          <>
            <button
              className="asset-usage"
              aria-expanded={expandedAsset === a.id}
              onClick={() => setExpandedAsset(expandedAsset === a.id ? null : a.id)}
            >
              ✓ Used in {placements.length} {placements.length === 1 ? 'screen' : 'screens'}{' '}
              <span>{expandedAsset === a.id ? '−' : 'View'}</span>
            </button>
            {expandedAsset === a.id && (
              <div className="asset-placements">
                {placements.map((s) => (
                  <button key={s.id} onClick={() => onLocate(s.id)}>
                    {s.title}
                    {s.mobileAssetId === a.id && s.assetId !== a.id ? ' (mobile)' : ''}
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <span className="asset-unused">Not used yet · drag it onto the board</span>
        )}
      </div>
    );
  };
  return (
    <aside
      className={`library ${drag ? 'drop-active' : ''}`}
      aria-label="Image library"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDrag(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          setDrag(false);
          onImport(Array.from(e.dataTransfer.files));
        }
      }}
    >
      <button
        className="icon-button library-close"
        onClick={onClose}
        aria-label="Close sketch library"
      >
        <X size={20} />
      </button>
      <div className="library-heading">
        <div>
          <span className="eyebrow">YOUR RAW MATERIAL</span>
          <h2>
            Sketch library <span>{project.assets.length}</span>
          </h2>
        </div>
        <TellAgent
          project={project}
          context={{ view: 'library' }}
          label=""
          title="Tell the agent about the library"
          className="icon-button"
        />
        <button
          className="icon-button"
          onClick={() => input.current?.click()}
          aria-label="Import images"
        >
          <Plus size={19} />
        </button>
      </div>
      <button className="folder-button" onClick={onFolder}>
        <span className="folder-icon">
          <FolderOpen size={19} />
        </span>
        <span>
          <strong>Connect a folder</strong>
          <small>From your computer</small>
        </span>
        <ArrowUpRight size={15} />
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept="image/*,.tif,.tiff"
        onChange={(e) => {
          onImport(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      {project.folders.length > 0 && (
        <div className="sources">
          <div className="source-heading">
            <span>
              <i /> LOCAL FOLDERS
            </span>
            <button
              className="icon-button"
              onClick={onRefresh}
              disabled={busy}
              aria-label="Refresh folders"
            >
              <RefreshCw size={13} className={busy ? 'spin' : ''} />
            </button>
          </div>
          {project.folders.map((folder) => (
            <div className="source" key={folder} title={folder}>
              <FolderOpen size={13} />
              <span>{folder.split(/[\\/]/).pop()}</span>
              <button
                className="icon-button"
                onClick={() => onDisconnect(folder)}
                aria-label={`Disconnect ${folder}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="search-box">
        <Search size={15} />
        <input
          aria-label="Search sketches"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a sketch…"
        />
        <kbd>⌕</kbd>
      </label>
      <div className="library-scroll">
        <details
          className="library-group new"
          open={openNew}
          onToggle={(e) => setOpenNew(e.currentTarget.open)}
        >
          <summary>
            <ChevronDown className="disclosure-arrow" size={16} />
            New <span>{fresh.length}</span>
          </summary>
          <div className="asset-list">{fresh.map(card)}</div>
          {!fresh.length && (
            <p className="library-note">
              {query
                ? 'No new sketches match.'
                : project.assets.length
                  ? 'Every sketch is on the board. Drop more below.'
                  : 'Connect a folder or drop your images below.'}
            </p>
          )}
        </details>
        <details
          className="library-group used"
          open={usedOpen}
          onToggle={(e) => setOpenUsed(e.currentTarget.open)}
        >
          <summary>
            <ChevronDown className="disclosure-arrow" size={16} />
            Used <span>{used.length}</span>
          </summary>
          <div className="asset-list">{used.map(card)}</div>
          {!used.length && (
            <p className="library-note">
              {query
                ? 'No used sketches match.'
                : 'Sketches move here when they land on the board.'}
            </p>
          )}
        </details>
      </div>
      <button className="import-zone" disabled={busy} onClick={() => input.current?.click()}>
        <ImagePlus size={20} />
        <strong>{busy ? 'Bringing in your sketches…' : 'Drop sketches here'}</strong>
        <span>or click to browse your files</span>
      </button>
      <div className="library-footer">
        <span className="local-dot" /> Just you & your ideas. Saved locally.
      </div>
    </aside>
  );
}
