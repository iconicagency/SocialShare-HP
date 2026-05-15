import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

const parser = new Parser();

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Try parsing as RSS first
    try {
      const feed = await parser.parseURL(url);
      const items = feed.items.map((item, index) => ({
        id: `rss-${index}`,
        title: item.title,
        content: item.contentSnippet || item.content,
        url: item.link,
        date: item.pubDate,
        source: feed.title || 'RSS Feed',
      }));
      return NextResponse.json({ type: 'rss', items });
    } catch (rssError) {
      console.log('Not an RSS feed, trying HTML parsing...', rssError);
    }

    // Fallback to HTML parsing for metadata
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content');
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content');
    const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

    return NextResponse.json({
      type: 'website',
      items: [
        {
          id: 'web-1',
          title: title || 'No title found',
          content: description || 'No description found',
          url: url,
          image: image,
          source: new URL(url).hostname,
          date: new Date().toISOString(),
        }
      ],
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
