const LOCAL_BACKEND = 'http://127.0.0.1:8000';

export function backendApiUrl(path: string) {
  const baseUrl = (process.env.BACKEND_API_URL ?? LOCAL_BACKEND).replace(/\/$/, '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
