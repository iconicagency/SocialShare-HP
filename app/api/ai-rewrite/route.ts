import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, platforms } = await req.json();
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY chưa được cấu hình trong Vercel env' }, { status: 500 });

    const platformNames = (platforms || []).join(', ') || 'social media';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Viết lại nội dung sau thành bài đăng hấp dẫn cho ${platformNames}. Ngắn gọn, dùng emoji phù hợp, thêm hashtag nếu cần. Chỉ trả về nội dung bài đăng, không giải thích thêm.\n\nNội dung gốc:\n${text}`,
            }],
          }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini API error');

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!result) throw new Error('Gemini trả về kết quả rỗng');

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI error' }, { status: 500 });
  }
}
