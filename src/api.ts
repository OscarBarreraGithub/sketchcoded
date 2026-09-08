import type { Project } from '../shared/model';
export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Drawcode-Client': 'local',
      ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    let message = 'The local server is unavailable.';
    try {
      message = (await response.json()).error || message;
    } catch {
      /* non-JSON server error */
    }
    throw new Error(message);
  }
  return response.json();
}
export const getProjects = () =>
  api<{ id: string; name: string; updatedAt: string; screenCount: number }[]>('/api/projects');
export async function exportProject(project: Project) {
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Drawcode-Client': 'local' },
    body: JSON.stringify(project),
  });
  if (!response.ok) throw new Error((await response.json()).error);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.replace(/[^a-z0-9-]/gi, '-')}.drawcode.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
