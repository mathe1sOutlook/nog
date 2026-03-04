export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // pdf-parse v2 uses PDFParse class with Uint8Array input
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: uint8 });
    const result = await parser.getText();

    // Concatenate all pages into a single text
    const text = result.pages.map((p: { text: string }) => p.text).join('\n');

    parser.destroy();

    return NextResponse.json({
      text,
      pages: result.pages.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF parse failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
