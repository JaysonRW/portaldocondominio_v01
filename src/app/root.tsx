import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useParams } from "react-router";
import "./../index.css"; // Global styles

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3E594D" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <Meta />
        <Links />
      </head>
      <body className="h-full flex flex-col bg-background text-foreground antialiased font-sans">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-[#C5D932] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando portal...</p>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const params = useParams()
  const tenantSlug = typeof params.tenantSlug === "string" && params.tenantSlug.trim().length > 0 ? params.tenantSlug : null
  const homeHref = tenantSlug ? `/${tenantSlug}` : "/"

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-10 shadow-sm text-center">
          <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-[#C5D932]/20 flex items-center justify-center">
            <span className="text-[#1a2e25] font-black text-xl">{error.status}</span>
          </div>
          <h1 className="text-2xl font-black text-[#1a2e25] uppercase tracking-tight">
            {error.status} {error.statusText}
          </h1>
          <p className="mt-3 text-slate-500 font-medium">
            {typeof error.data === "string" ? error.data : "Não foi possível carregar esta página."}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={homeHref}
              className="inline-flex items-center justify-center rounded-2xl bg-[#C5D932] px-6 py-4 font-black text-[#1a2e25] uppercase tracking-widest text-xs"
            >
              Voltar ao Início
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-600 uppercase tracking-widest text-xs hover:bg-slate-50"
            >
              Recarregar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const message = error instanceof Error ? error.message : "Erro inesperado."

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-10 shadow-sm text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <span className="text-red-600 font-black text-xl">!</span>
        </div>
        <h1 className="text-2xl font-black text-[#1a2e25] uppercase tracking-tight">
          Algo deu errado
        </h1>
        <p className="mt-3 text-slate-500 font-medium">{message}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={homeHref}
            className="inline-flex items-center justify-center rounded-2xl bg-[#C5D932] px-6 py-4 font-black text-[#1a2e25] uppercase tracking-widest text-xs"
          >
            Voltar ao Início
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-600 uppercase tracking-widest text-xs hover:bg-slate-50"
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  )
}
