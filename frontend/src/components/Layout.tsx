import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-muted no-print">
        <div className="max-w-7xl mx-auto px-4">
          <strong>Automação RJOS</strong> &bull; Jar Test v2.0 &bull; Em conformidade com a Portaria GM/MS nº 888/2021
        </div>
      </footer>
    </div>
  )
}
