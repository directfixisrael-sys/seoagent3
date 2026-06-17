import 'server-only';
import axios from 'axios';

function getAuth() {
  const url = process.env.WP_URL || '';
  const user = process.env.WP_USERNAME || '';
  const pass = process.env.WP_APP_PASSWORD || '';
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  return { url, headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' } };
}

export async function uploadImage(imageUrl: string, title: string): Promise<number | null> {
  try {
    const { url, headers } = getAuth();
    const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.jpg`;
    const res = await axios.post(`${url}/wp-json/wp/v2/media`, Buffer.from(img.data), {
      headers: { ...headers, 'Content-Type': 'image/jpeg', 'Content-Disposition': `attachment; filename="${filename}"` },
    });
    return res.data.id;
  } catch { return null; }
}

export async function publishPost(params: {
  title: string; content: string; slug: string;
  metaTitle: string; metaDescription: string; featuredMediaId?: number | null;
}): Promise<{ id: number; link: string }> {
  const { url, headers } = getAuth();
  const res = await axios.post(`${url}/wp-json/wp/v2/posts`, {
    title: params.title,
    content: params.content,
    slug: params.slug,
    status: 'publish',
    featured_media: params.featuredMediaId || 0,
    meta: {
      _yoast_wpseo_title: params.metaTitle,
      _yoast_wpseo_metadesc: params.metaDescription,
      rank_math_title: params.metaTitle,
      rank_math_description: params.metaDescription,
    },
  }, { headers });
  return { id: res.data.id, link: res.data.link };
}

export async function testConnection(): Promise<boolean> {
  try {
    const { url, headers } = getAuth();
    await axios.get(`${url}/wp-json/wp/v2/users/me`, { headers });
    return true;
  } catch { return false; }
}
