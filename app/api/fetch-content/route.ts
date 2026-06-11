import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

const parser = new Parser({ timeout: 10000 });

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function tryRss(url: string) {
  const feed = await parser.parseURL(url);
  return {
    type: 'rss',
    items: feed.items.slice(0, 20).map((item, i) => ({
      id: `rss-${i}`,
      title: item.title || 'No title',
      content: item.contentSnippet || item.content || '',
      url: item.link || url,
      date: item.pubDate || new Date().toISOString(),
      source: feed.title || new URL(url).hostname,
    })),
  };
}

async function tryWordPressApi(url: string) {
  const base = url.replace(/\/feed\/?$/, '').replace(/\/$/, '');
  const apiUrl = `${base}/wp-json/wp/v2/posts?per_page=20&_fields=id,title,excerpt,link,date,jetpack_featured_media_url`;
  const res = await fetch(apiUrl, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('Not a WP REST API');
  const posts = await res.json();
  if (!Array.isArray(posts) || posts.length === 0) throw new Error('No posts');
  return {
    type: 'rss',
    items: posts.map((p: any, i: number) => ({
      id: `wp-${p.id || i}`,
      title: p.title?.rendered ? p.title.rendered.replace(/<[^>]+>/g, '') : 'No title',
      content: p.excerpt?.rendered ? p.excerpt.rendered.replace(/<[^>]+>/g, '') : '',
      url: p.link || '',
      date: p.date || new Date().toISOString(),
      image: p.jetpack_featured_media_url || '',
      source: new URL(base).hostname,
    })),
  };
}

async function tryHtml(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    'No title';
  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    '';
  const image =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    '';
  return {
    type: 'website',
    items: [{
      id: 'web-1',
      title: title.trim(),
      content: description.trim(),
      url,
      image,
      source: new URL(url).hostname,
      date: new Date().toISOString(),
    }],
  };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    // Validate URL
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch {
      return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ HTTP/HTTPS' }, { status: 400 });
    }

    const errors: string[] = [];

    // 1. Try RSS/Atom
    try { return NextResponse.json(await tryRss(url)); } catch (e: any) { errors.push(`RSS: ${e.message}`); }

    // 2. Try WordPress REST API (auto-detect from any WP URL)
    try { return NextResponse.json(await tryWordPressApi(url)); } catch (e: any) { errors.push(`WP API: ${e.message}`); }

    // 3. Try RSS at common feed paths
    const feedPaths = ['/feed', '/feed/', '/rss', '/rss.xml', '/?feed=rss2', '/atom.xml'];
    for (const path of feedPaths) {
      try {
        const feedUrl = parsedUrl.origin + path;
        return NextResponse.json(await tryRss(feedUrl));
      } catch (e: any) { errors.push(`Feed ${path}: ${e.message}`); }
    }

    // 4. Fallback: HTML metadata
    try { return NextResponse.json(await tryHtml(url)); } catch (e: any) { errors.push(`HTML: ${e.message}`); }

    return NextResponse.json({ error: `Không thể fetch nội dung. Chi tiết: ${errors.slice(-2).join(' | ')}` }, { status: 500 });
  } catch (error: any) {
    console.error('Fetch-content error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
