'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Usuario ou senha incorretos');
      }
    } catch {
      setError('Erro de conexao');
    } finally {
      setLoading(false);
    }
  }

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

        <div className="p-5 sm:p-8">
          <Card className="border-none bg-transparent p-0 shadow-none">
            <CardHeader className="px-0 pb-6 text-center">
              <CardTitle className="text-3xl font-semibold tracking-tight">Nog</CardTitle>
              <CardDescription>Acesse para continuar</CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Usuario
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
