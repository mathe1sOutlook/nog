'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'Este email nao esta cadastrado no sistema. Contate o administrador.',
  inactive: 'Sua conta esta desativada. Contate o administrador.',
  exchange_failed: 'Falha na autenticacao. Tente novamente.',
  no_code: 'Erro no fluxo de autenticacao. Tente novamente.',
  no_email: 'Nao foi possivel obter seu email. Tente novamente.',
};

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <Card className="w-full border-none bg-transparent p-0 shadow-none">
      <CardHeader className="px-0 pb-6 text-center">
        <CardTitle className="text-3xl font-semibold tracking-tight">Nog</CardTitle>
        <CardDescription>Acesse com sua conta Google</CardDescription>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        {errorCode && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {ERROR_MESSAGES[errorCode] ?? 'Erro desconhecido. Tente novamente.'}
          </p>
        )}

        <Button
          onClick={handleGoogleLogin}
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecionando...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Entrar com Google
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Apenas contas pre-cadastradas pelo administrador podem acessar.
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl" />

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/40 bg-card/80 shadow-2xl shadow-slate-900/15 backdrop-blur-xl md:grid-cols-2">
        <div className="relative hidden bg-slate-900 p-10 text-slate-100 md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.3),transparent_45%)]" />
          <div className="relative">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Painel seguro
            </p>
            <h1 className="text-3xl font-semibold leading-tight">Conferencia de repasses medicos</h1>
            <p className="mt-4 text-sm text-slate-200/80">
              Centralize uploads, compare producao e repasse e identifique divergencias em minutos.
            </p>
          </div>
        </div>

        <div className="flex items-center p-5 sm:p-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
