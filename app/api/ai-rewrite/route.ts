import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    const { text, platforms } = await req.json();
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY chưa được cấu hình trong Vercel env' }, { status: 500 });

    const client = new Anthropic({ apiKey });
    const platformNames = (platforms || []).join(', ') || 'social media';

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Viết lại nội dung sau thành bài đăng hấp dẫn cho ${platformNames}. Ngắn gọn, dùng emoji phù hợp, thêm hashtag nếu cần. Chỉ trả về nội dung bài đăng, không giải thích thêm.\n\nNội dung gốc:\n${text}`,
      }],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI error' }, { status: 500 });
  }
}
