import { apiClient } from './axios';

export async function downloadCsv(
  endpoint: string,
  params: Record<string, unknown>,
  filename: string,
) {
  const res = await apiClient.get(endpoint, { params, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
