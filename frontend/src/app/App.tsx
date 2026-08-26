import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavLink, Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthorsListPage } from '@/features/authors/AuthorsListPage'
import { BooksListPage } from '@/features/books/BooksListPage'
import { GenresListPage } from '@/features/genres/GenresListPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A catalog does not change under the user's feet; refetching on every
      // window focus is noise, not freshness.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const NAV_ITEMS = [
  { to: '/books', label: 'Books' },
  { to: '/authors', label: 'Authors' },
  { to: '/genres', label: 'Genres' },
]

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Library Catalog</span>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/books" replace />} />
            <Route path="/books" element={<BooksListPage />} />
            <Route path="/authors" element={<AuthorsListPage />} />
            <Route path="/genres" element={<GenresListPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  )
}
