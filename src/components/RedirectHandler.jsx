import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  increment 
} from 'firebase/firestore'
import { Link as LinkIcon, AlertCircle } from 'lucide-react'

export default function RedirectHandler() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const q = query(collection(db, 'links'), where('shortCode', '==', code))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const linkDoc = querySnapshot.docs[0]
          const linkData = linkDoc.data()
          
          // Increment clicks
          await updateDoc(doc(db, 'links', linkDoc.id), {
            clicks: increment(1)
          })

          // Redirect
          window.location.href = linkData.originalUrl
        } else {
          setError(true)
        }
      } catch (err) {
        console.error(err)
        setError(true)
      }
    }

    handleRedirect()
  }, [code])

  if (error) {
    return (
      <div className="flex-center h-screen bg-black flex-col p-6">
        <div className="card max-w-sm w-full text-center border-red-900/50">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Link não encontrado</h1>
          <p className="text-zinc-500 mb-6">O link que você tentou acessar não existe ou foi removido.</p>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-center h-screen bg-black flex-col">
      <div className="w-20 h-20 bg-[#CCFF00]/10 rounded-full flex-center mb-6 animate-pulse">
        <LinkIcon className="text-[#CCFF00] w-10 h-10" />
      </div>
      <h1 className="text-xl font-bold">Redirecionando...</h1>
      <p className="text-zinc-500 text-sm mt-2">Você está sendo levado ao destino final.</p>
    </div>
  )
}
