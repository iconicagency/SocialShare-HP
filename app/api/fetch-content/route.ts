import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

const parser = new Parser({ timeout: 10000 });
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/json, text/html, */*',
};

function stripHtml(html: string) {
  return html ? html.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#\d+;/g,'').replace(/&nbsp;/g,' ').trim() : '';
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data?.code && data?.message) throw new Error(data.message); // WP error
  return data;
}

function mapWpPosts(posts: any[], hostname: string) {
  return posts.map((p: any, i: number) => ({
    id: `wp-${p.id || i}`,
    title: stripHtml(p.title?.rendered || 'No title'),
    content: stripHtml(p.excerpt?.rendered || p.content?.rendered || ''),
    url: p.link || '',
    date: p.date || new Date().toISOString(),
    image: p.jetpack_featured_media_url || p._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
    source: hostname,
  }));
}

// WP REST API: lấy bài theo category slug từ URL
async function tryWordPressCategory(inputUrl: string) {
  const parsed = new URL(inputUrl);
  const base = parsed.origin;
  const hostname = parsed.hostname;
  const pathParts = parsed.pathname.replace(/^\//,'').replace(/\/$/,'').split('/').filter(Boolean);

  if (pathParts.length === 0) throw new Error('No path slug');

  // Thử từng slug từ cuối vào trong (hỗ trợ nested: /danh-muc/con)
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const slug = pathParts[i];
    let filterId: number | null = null;
    let filterKey = '';

    // Thử category
    try {
      const cats = await fetchJson(`${base}/wp-json/wp/v2/categories?slug=${slug}&_fields=id,name,slug`);
      if (Array.isArray(cats) && cats.length > 0) {
        filterId = cats[0].id;
        filterKey = 'categories';
      }
    } catch {}

    // Thử tag nếu không có category
    if (!filterId) {
      try {
        const tags = await fetchJson(`${base}/wp-json/wp/v2/tags?slug=${slug}&_fields=id,name,slug`);
        if (Array.isArray(tags) && tags.length > 0) {
          filterId = tags[0].id;
          filterKey = 'tags';
        }
      } catch {}
    }

    if (!filterId) continue; // thử slug tiếp theo

    // Lấy tất cả bài, phân trang
    let allPosts: any[] = [];
    let page = 1;
    while (page <= 5) { // tối đa 100 bài
      try {
        const posts = await fetchJson(
          `${base}/wp-json/wp/v2/posts?${filterKey}=${filterId}&per_page=20&page=${page}&orderby=date&order=desc&_fields=id,title,excerpt,link,date,jetpack_featured_media_url`
        );
        if (!Array.isArray(posts) || posts.length === 0) break;
        allPosts = [...allPosts, ...posts];
        if (posts.length < 20) break;
        page++;
      } catch { break; }
    }

    if (allPosts.length === 0) throw new Error(`Danh mục "${slug}" không có bài viết`);

    return {
      type: 'wordpress_category',
      categorySlug: slug,
      totalFetched: allPosts.length,
      items: mapWpPosts(allPosts, hostname),
    };
  }

  throw new Error(`Không tìm thấy danh mục WordPress cho URL này`);
}

// WP REST API: tất cả bài mới nhất
async function tryWordPressAll(url: string) {
  const base = new URL(url).origin;
  const hostname = new URL(url).hostname;
  const posts = await fetchJson(`${base}/wp-json/wp/v2/posts?per_page=20&orderby=date&order=desc&_fields=id,title,excerpt,link,date,jetpack_featured_media_url`);
  if (!Array.isArray(posts) || posts.length === 0) throw new Error('No posts');
  return { type: 'rss', items: mapWpPosts(posts, hostname) };
}

// RSS/Atom
async function tryRss(url: string) {
  const feed = await parser.parseURL(url);
  if (!feed.items?.length) throw new Error('Empty feed');
  return {
    type: 'rss',
    items: feed.items.slice(0, 50).map((item, i) => ({
      id: `rss-${i}`,
      title: item.title || 'No title',
      content: item.contentSnippet || item.content || '',
      url: item.link || url,
      date: item.pubDate || new Date().toISOString(),
      source: feed.title || new URL(url).hostname,
    })),
  };
}

// HTML metadata fallback
async function tryHtml(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  return {
    type: 'website',
    items: [{
      id: 'web-1',
      title: ($('meta[property="og:title"]').attr('content') || $('title').text() || 'No title').trim(),
      content: ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '').trim(),
      url,
      image: $('meta[property="og:image"]').attr('content') || '',
      source: new URL(url).hostname,
      date: new Date().toISOString(),
    }],
  };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 }); }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return NextResponse.json({ error: 'Chỉ hỗ trợ HTTP/HTTPS' }, { status: 400 });

    const hasPath = parsedUrl.pathname !== '/' && parsedUrl.pathname !== '';
    const isRssUrl = /\/(feed|rss|atom|\.xml)/i.test(parsedUrl.pathname);
    const errors: string[] = [];

    // Nếu URL trông giống RSS feed → thử RSS trước
    if (isRssUrl) {
      try { return NextResponse.json(await tryRss(url)); } catch (e: any) { errors.push(`RSS: ${e.message}`); }
    }

    // Nếu có path (danh mục) → ưu tiên WP Category API
    if (hasPath && !isRssUrl) {
      try { return NextResponse.json(await tryWordPressCategory(url)); } catch (e: any) { errors.push(`WP Category: ${e.message}`); }
    }

    // Domain gốc → thử WP all posts
    try { return NextResponse.json(await tryWordPressAll(url)); } catch (e: any) { errors.push(`WP All: ${e.message}`); }

    // RSS fallback
    if (!isRssUrl) {
      try { return NextResponse.json(await tryRss(url)); } catch (e: any) { errors.push(`RSS: ${e.message}`); }
      for (const path of ['/feed', '/feed/', '/rss.xml', '/?feed=rss2']) {
        try { return NextResponse.json(await tryRss(parsedUrl.origin + path)); } catch (e: any) { errors.push(`Feed${path}: ${e.message}`); }
      }
    }

    // HTML fallback
    try { return NextResponse.json(await tryHtml(url)); } catch (e: any) { errors.push(`HTML: ${e.message}`); }

    return NextResponse.json({ error: `Không thể fetch nội dung.\n${errors.join('\n')}` }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
