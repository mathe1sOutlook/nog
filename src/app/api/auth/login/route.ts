import { NextRequest, NextResponse } from 'next/server';

const CREDENTIALS = {
  username: 'admin',
  password: 'haxixe123',
};

const SESSION_COOKIE = 'nog-session';
const SESSION_VALUE = 'authenticated';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
}
