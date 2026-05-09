import { useState } from 'react'
import { auth, googleProvider } from '../firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth'
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError('Erro na autenticação. Verifique seus dados.')
      console.error(err)
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError('Erro ao entrar com Google.')
    }
  }

  return (
    <div className="flex-center min-h-screen p-4 bg-black">
      <div className="glass max-w-md w-full p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 text-[#CCFF00]">
            Encurta Link Senai
          </h1>
          <p className="text-zinc-400">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta gratuita'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input
              type="email"
              placeholder="Seu e-mail"
              className="input pl-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input
              type="password"
              placeholder="Sua senha"
              className="input pl-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full py-4">
            {isLogin ? (
              <><LogIn className="w-5 h-5" /> Entrar</>
            ) : (
              <><UserPlus className="w-5 h-5" /> Criar Conta</>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#141414] px-2 text-zinc-500">Ou continue com</span>
          </div>
        </div>

        <button 
          onClick={handleGoogle}
          className="btn btn-secondary w-full py-4"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5 mr-2" alt="Google" />
          Google
        </button>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-[#CCFF00] font-bold hover:underline"
          >
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </p>
      </div>
    </div>
  )
}
