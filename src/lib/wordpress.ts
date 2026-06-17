import 'server-only';
import axios from 'axios';

interface WPPost {
  id: number;
  link: string;
  status: string;
}

function getWPConfig() {
  return {
    url: process.env.WP_URL || '',
    username: process.env.WP_USERNAME || '',
    appPassword: process.env.WP_APP_PASSWORD || '',
  };
}

function getAuthHeader() {
  const { username, appPassword } = getWPConfig();
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
  return `Basic ${token}`;
}

export async function uploadImageToWordPress(imageUrl: string, title: string): Promise<number> {
  const { url } = getWPConfig();

  // הורד את התמונה
  const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(imgResponse.data);

  const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.jpg`;

  const response = await axios.post(
    `${url}/wp-json/wp/v2/media`,
    buffer,
    {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    }
  );

  return response.data.id;
}

export async function publishToWordPress(params: {
  title: string;
  content: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  featuredMediaId?: number;
  categoryIds?: number[];
  tags?: string[];
}): Promise<WPPost> {
  const { url } = getWPConfig();

  const postData: Record<string, unknown> = {
    title: params.title,
    content: params.content,
    slug: params.slug,
    status: 'publish',
    meta: {
      _yoast_wpseo_title: params.metaTitle,
      _yoast_wpseo_metadesc: params.metaDescription,
      rank_math_title: params.metaTitle,
      rank_math_description: params.metaDescription,
    },
  };

  if (params.featuredMediaId) {
    postData.featured_media = params.featuredMediaId;
  }
  if (params.categoryIds?.length) {
    postData.categories = params.categoryIds;
  }

  const response = await axios.post(`${url}/wp-json/wp/v2/posts`, postData, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });

  return {
    id: response.data.id,
    link: response.data.link,
    status: response.data.status,
  };
}

export async function testWordPressConnection(): Promise<boolean> {
  try {
    const { url } = getWPConfig();
    await axios.get(`${url}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: getAuthHeader() },
    });
    return true;
  } catch {
    return false;
  }
}
