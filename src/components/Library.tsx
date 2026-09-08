import { useRef, useState } from 'react';
import {
  FolderOpen,
  ImagePlus,
  Plus,
  Search,
  ArrowUpRight,
  RefreshCw,
  X,
  FileImage,
} from 'lucide-react';
import { assetUrl, type Asset, type Project } from '../../shared/model';
export function Library({
  project,
  onImport,
  onFolder,
  onRefresh,
  onDisconnect,
  onAdd,
  busy,
}: {
  project: Project;
  onImport: (files: File[]) => void;
  onFolder: () => void;
  onRefresh: () => void;
  onDisconnect: (folder: string) => void;
  onAdd: (asset: Asset) => void;
  busy: boolean;
}) {
  const input = useRef<HTMLInputElement>(null),
    [query, setQuery] = useState(''),
    [drag, setDrag] = useState(false);
  const assets = project.assets.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
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
      <div className="library-heading">
        <div>
          <span className="eyebrow">YOUR RAW MATERIAL</span>
          <h2>
            Sketch library <span>{project.assets.length}</span>
          </h2>
        </div>
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
        <div className="library-section">
          <span>ALL SKETCHES</span>
          <span>↕</span>
        </div>
        <div className="asset-list">
          {assets.map((a, index) => {
            const used = project.screens.filter((s) => s.assetId === a.id).length;
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
                  {used > 0 && (
                    <span className="asset-used">ON BOARD{used > 1 ? ` · ${used}` : ''}</span>
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
              </div>
            );
          })}
        </div>
        {!assets.length && (
          <div className="empty-library">
            <FileImage size={30} />
            <p>{query ? 'No matching sketches.' : 'Every idea starts somewhere.'}</p>
            <small>
              {query ? 'Try another name.' : 'Connect a folder or drop your images here.'}
            </small>
          </div>
        )}
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
