import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img
              src="/imagens/logo.jpg"
              alt="Logo Jar Test"
              className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none'
              }}
            />
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Jar-Test Digital
                <span className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 font-semibold px-2 py-0.5 rounded">
                  v2.0
                </span>
              </span>
              <p className="text-xs text-muted -mt-0.5 hidden sm:block">
                Cálculo de Dosagens & Ensaios Laboratoriais
              </p>
            </div>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center ml-8 gap-4 text-sm font-medium">
              <Link
                to="/"
                className="text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors"
              >
                Meus Projetos
              </Link>
              <Link
                to="/projetos/novo"
                className="text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors"
              >
                + Novo Ensaio
              </Link>
              <Link
                to="/contrato"
                className="text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors"
              >
                Contrato
              </Link>
              <Link
                to="/plano"
                className="text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5"
              >
                <span>Planos</span>
                {user.pago ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                    PRO
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded">
                    FREE
                  </span>
                )}
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Admin</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">
                    ADMIN
                  </span>
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.nome}{user.sobrenome ? ` ${user.sobrenome}` : ''}
                </div>
                <div className="text-xs text-muted">{user.email}</div>
              </div>
              <Link to="/perfil" className="btn btn-outline text-xs py-1.5 px-3">
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-xs py-1.5 px-3"
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-outline text-xs">
                Entrar
              </Link>
              <Link to="/registrar" className="btn btn-primary text-xs">
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
