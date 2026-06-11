import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

const parser = new Parser({ timeout: 10000 });
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/json, text/html, */*',
};

// --- Helpers ---

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function stripHtml(html: string) {
  return html ? html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8211;/g, '-').replace(/&#8216;/g, "'").replace(/&#8217;/g, "'").replace(/&nbsp;/g, ' ').trim() : '';
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

// 1. RSS/Atom
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

// 2. WP REST API: lấy tất cả bài (tự động detect slug danh mục từ URL)
async function tryWordPressCategory(inputUrl: string) {
  const parsed = new URL(inputUrl);
  const base = parsed.origin;
  const hostname = parsed.hostname;

  // Bước 1: Lấy slug từ path (ví dụ: /tin-tuc, /noi-that-van-phong)
  const pathParts = parsed.pathname.replace(/^\//,'').replace(/\/$/,'').split('/');
  const slug = pathParts[pathParts.length - 1]; // slug cuối cùng

  if (!slug || slug === '') throw new Error('No slug in URL');

  // Bước 2: Tìm category ID từ slug
  let categoryId: number | null = null;
  try {
    const cats = await fetchJson(`${base}/wp-json/wp/v2/categories?slug=${slug}&_fields=id,name,slug`);
    if (Array.isArray(cats) && cats.length > 0) {
      categoryId = cats[0].id;
    }
  } catch {}

  // Bước 3: Nếu không tìm được category, thử tìm theo tag
  let tagId: number | null = null;
  if (!categoryId) {
    try {
      const tags = await fetchJson(`${base}/wp-json/wp/v2/tags?slug=${slug}&_fields=id,name,slug`);
      if (Array.isArray(tags) && tags.length > 0) {
        tagId = tags[0].id;
      }
    } catch {}
  }

  if (!categoryId && !tagId) throw new Error(`Không tìm thấy danh mục "${slug}" trên WordPress`);

  // Bước 4: Lấy bài viết theo category/tag, phân trang nếu cần
  const filterParam = categoryId ? `categories=${categoryId}` : `tags=${tagId}`;
  let allPosts: any[] = [];
  let page = 1;
  const maxPages = 5; // tối đa 5 trang = 100 bài

  while (page <= maxPages) {
    try {
      const posts = await fetchJson(
        `${base}/wp-json/wp/v2/posts?${filterParam}&per_page=20&page=${page}&_fields=id,title,excerpt,content,link,date,jetpack_featured_media_url&_embed=wp:featuredmedia`
      );
      if (!Array.isArray(posts) || posts.length === 0) break;
      allPosts = [...allPosts, ...posts];
      if (posts.length < 20) break; // trang cuối
      page++;
    } catch {
      break;
    }
  }

  if (allPosts.length === 0) throw new Error('Không có bài viết nào trong danh mục này');

  const categoryName = categoryId
    ? (await fetchJson(`${base}/wp-json/wp/v2/categories/${categoryId}?_fields=name`).catch(() => ({ name: slug }))).name
    : slug;

  return {
    type: 'rss',
    categoryName: stripHtml(categoryName),
    items: mapWpPosts(allPosts, hostname),
  };
}

// 3. WP REST API: lấy tất cả bài mới nhất (không lọc)
async function tryWordPressAll(url: string) {
  const base = url.replace(/\/feed\/?$/, '').replace(/\/$/, '');
  const hostname = new URL(base).hostname;
  const posts = await fetchJson(
    `${base}/wp-json/wp/v2/posts?per_page=20&_fields=id,title,excerpt,link,date,jetpack_featured_media_url`
  );
  if (!Array.isArray(posts) || posts.length === 0) throw new Error('No posts');
  return { type: 'rss', items: mapWpPosts(posts, hostname) };
}

// 4. HTML metadata fallback
async function tryHtml(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'No title';
  const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const image = $('meta[property="og:image"]').attr('content') || '';
  return {
    type: 'website',
    items: [{ id: 'web-1', title: title.trim(), content: description.trim(), url, image, source: new URL(url).hostname, date: new Date().toISOString() }],
  };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 }); }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return NextResponse.json({ error: 'Chỉ hỗ trợ HTTP/HTTPS' }, { status: 400 });

    const errors: string[] = [];

    // 1. RSS trực tiếp
    try { return NextResponse.json(await tryRss(url)); } catch (e: any) { errors.push(`RSS: ${e.message}`); }

    // 2. WP category (khi URL có path slug, ví dụ: /tin-tuc, /san-pham/noi-that-van-phong)
    if (parsedUrl.pathname !== '/') {
      try { return NextResponse.json(await tryWordPressCategory(url)); } catch (e: any) { errors.push(`WP Category: ${e.message}`); }
    }

    // 3. WP tất cả bài (khi nhập domain gốc)
    try { return NextResponse.json(await tryWordPressAll(url)); } catch (e: any) { errors.push(`WP All: ${e.message}`); }

    // 4. RSS các path phổ biến
    for (const path of ['/feed', '/feed/', '/rss', '/rss.xml', '/?feed=rss2']) {
      try { return NextResponse.json(await tryRss(parsedUrl.origin + path)); } catch (e: any) { errors.push(`Feed${path}: ${e.message}`); }
    }

    // 5. HTML fallback
    try { return NextResponse.json(await tryHtml(url)); } catch (e: any) { errors.push(`HTML: ${e.message}`); }

    return NextResponse.json({ error: `Không thể fetch nội dung.\n${errors.slice(-3).join('\n')}` }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
