import 'server-only';
import { google } from 'googleapis';

function getGSCClient() {
  const credentials = process.env.GSC_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON)
    : null;
  if (!credentials) return null;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

const fmt = (d: Date) => d.toISOString().split('T')[0];

export async function getKeywordPerformance(
  keyword: string,
  siteUrl: string,
  days = 28
): Promise<{ clicks: number; impressions: number; ctr: number; position: number } | null> {
  try {
    const client = getGSCClient();
    if (!client) return null;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const res = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query'],
        dimensionFilterGroups: [{
          filters: [{ dimension: 'query', operator: 'contains', expression: keyword.toLowerCase() }],
        }],
        rowLimit: 1,
      },
    });
    const row = res.data?.rows?.[0];
    if (!row) return null;
    return {
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: Math.round((row.ctr ?? 0) * 10000) / 100,
      position: Math.round((row.position ?? 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}

export async function getSiteOverview(siteUrl: string, days = 28) {
  try {
    const client = getGSCClient();
    if (!client) return null;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const res = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['date'],
        rowLimit: days,
      },
    });
    return (res.data?.rows ?? []).map((r) => ({
      date: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      position: Math.round((r.position ?? 0) * 10) / 10,
    }));
  } catch {
    return null;
  }
}

export async function getTopKeywords(siteUrl: string, limit = 20) {
  try {
    const client = getGSCClient();
    if (!client) return [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const res = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query'],
        rowLimit: limit,
      },
    });
    return (res.data?.rows ?? []).map((r) => ({
      keyword: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: Math.round((r.ctr ?? 0) * 10000) / 100,
      position: Math.round((r.position ?? 0) * 10) / 10,
    }));
  } catch {
    return [];
  }
}
