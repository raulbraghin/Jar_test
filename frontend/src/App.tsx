import { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import Contrato from './pages/Contrato'
import Dashboard from './pages/Dashboard'
import EnsaioJarTest from './pages/EnsaioJarTest'
import Login from './pages/Login'
import Perfil from './pages/Perfil'
import Plano from './pages/Plano'
import ProjetoForm from './pages/ProjetoForm'
import Registrar from './pages/Registrar'
import Relatorio from './pages/Relatorio'
import VerificarEmail from './pages/VerificarEmail'
import { ThemeProvider } from './theme/ThemeContext'

function Protected({ children, requireComplete = true }: { children: ReactNode; requireComplete?: boolean }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="p-16 text-center text-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent mb-3" />
        <p>Carregando sessão...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (requireComplete && !user.perfil_completo) return <Navigate to="/perfil" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registrar" element={<Registrar />} />
            <Route path="/verificar-email" element={<VerificarEmail />} />

            <Route element={<Layout />}>
              <Route
                path="/perfil"
                element={
                  <Protected requireComplete={false}>
                    <Perfil />
                  </Protected>
                }
              />
              <Route
                path="/contrato"
                element={
                  <Protected requireComplete={false}>
                    <Contrato />
                  </Protected>
                }
              />
              <Route
                path="/"
                element={
                  <Protected>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route
                path="/projetos/novo"
                element={
                  <Protected>
                    <ProjetoForm />
                  </Protected>
                }
              />
              <Route
                path="/projetos/:id/ensaio"
                element={
                  <Protected>
                    <EnsaioJarTest />
                  </Protected>
                }
              />
              <Route
                path="/projetos/:id/relatorio"
                element={
                  <Protected>
                    <Relatorio />
                  </Protected>
                }
              />
              <Route
                path="/plano"
                element={
                  <Protected>
                    <Plano />
                  </Protected>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
