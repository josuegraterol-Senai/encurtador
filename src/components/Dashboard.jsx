import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import {
  Link as LinkIcon,
  Copy,
  Trash2,
  ExternalLink,
  LogOut,
  BarChart3,
  Calendar,
  Pencil,
  X,
  QrCode
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard({ user }) {
  const [url, setUrl] = useState('')
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(false)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [editUrl, setEditUrl] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editError, setEditError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete & Toast State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [qrLink, setQrLink] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  useEffect(() => {
    // Simplificando a consulta para evitar necessidade de índice composto inicialmente
    const q = query(
      collection(db, 'links'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) // Ordenação local

      setLinks(linksData)
    }, (error) => {
      console.error("Erro no onSnapshot:", error)
    })

    return () => unsubscribe()
  }, [user.uid])

  const handleShorten = async (e) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    try {
      // Normalização da URL: adiciona https:// se o usuário esquecer
      let normalizedUrl = url.trim()
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`
      }

      const code = nanoid(6)
      await addDoc(collection(db, 'links'), {
        originalUrl: normalizedUrl,
        shortCode: code,
        clicks: 0,
        userId: user.uid,
        createdAt: serverTimestamp()
      })
      setUrl('')
    } catch (err) {
      console.error("Erro ao salvar no Firestore:", err)
      alert('Erro ao encurtar link. Verifique sua conexão ou permissões.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (code) => {
    const shortUrl = `${window.location.origin}/r/${code}`
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shortUrl)
        showToast('Link copiado com sucesso!')
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = shortUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        showToast('Link copiado!')
      }
    } catch (err) {
      console.error('Erro ao copiar:', err)
      showToast('Não foi possível copiar.')
    }
  }

  const openDeleteModal = (id) => {
    setLinkToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const openQrModal = (link) => {
    setQrLink(link)
    setIsQrModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!linkToDelete) return
    try {
      await deleteDoc(doc(db, 'links', linkToDelete))
      setIsDeleteModalOpen(false)
      setLinkToDelete(null)
      showToast('Link excluído!')
    } catch (err) {
      console.error("Erro ao deletar link:", err)
      showToast('Erro ao excluir. Verifique permissões.')
      setIsDeleteModalOpen(false)
    }
  }

  const openEditModal = (link) => {
    setEditingLink(link)
    setEditUrl(link.originalUrl)
    setEditCode(link.shortCode)
    setEditError('')
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingLink(null)
  }

  const handleUpdateLink = async (e) => {
    e.preventDefault()
    if (!editUrl || !editCode) return

    const newCode = editCode.trim()
    if (newCode.length < 4 || newCode.length > 20) {
      setEditError('O código deve ter entre 4 e 20 caracteres.')
      return
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(newCode)) {
      setEditError('O código deve conter apenas letras, números, hífens ou sublinhados.')
      return
    }

    setIsSavingEdit(true)
    setEditError('')

    try {
      let normalizedUrl = editUrl.trim()
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`
      }

      if (newCode !== editingLink.shortCode) {
        const qCheck = query(collection(db, 'links'), where('shortCode', '==', newCode))
        const snapshot = await getDocs(qCheck)
        if (!snapshot.empty) {
          setEditError('Este código curto já está em uso. Escolha outro.')
          setIsSavingEdit(false)
          return
        }
      }

      await updateDoc(doc(db, 'links', editingLink.id), {
        originalUrl: normalizedUrl,
        shortCode: newCode
      })

      closeEditModal()
    } catch (err) {
      console.error("Erro ao atualizar no Firestore:", err)
      setEditError('Erro ao salvar. Verifique sua conexão ou permissões.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#CCFF00] rounded-xl flex-center shadow-[0_0_15px_rgba(204,255,0,0.4)]">
              <LinkIcon className="text-black w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-white hidden sm:block">
              Encurta Link Senai
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Conta Ativa</p>
              <p className="text-sm font-medium text-zinc-200">{user.email}</p>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="btn btn-outline p-2.5 rounded-xl border-zinc-800 hover:bg-red-900/10 hover:border-red-900/50 hover:text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Shorten Form */}
        <section className="glass p-8 mb-12 border-zinc-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#CCFF00]/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>

          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#CCFF00] rounded-full"></span>
            Encurtar Novo Link
          </h2>

          <form onSubmit={handleShorten} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Cole sua URL longa aqui (ex: google.com)"
              className="input flex-1 bg-zinc-900/50 border-zinc-800"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className="btn btn-primary px-8 h-[54px] disabled:opacity-50"
            >
              {loading ? 'PROCESSANDO...' : 'ENCURTAR'}
            </button>
          </form>
        </section>

        {/* Links List */}
        <section>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-zinc-700 rounded-full"></span>
            Seus Links
          </h2>

          {links.length === 0 ? (
            <div className="card text-center py-16 border-dashed border-zinc-800 bg-transparent">
              <p className="text-zinc-500">Nenhum link criado ainda. Comece encurtando um acima!</p>
            </div>
          ) : (
            <div className="links-grid">
              {links.map((link) => (
                <div key={link.id} className="card group hover:scale-[1.01]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          /{link.shortCode}
                        </span>
                        <span className="text-zinc-600 text-xs flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          {link.createdAt ? format(link.createdAt.toDate(), "dd 'de' MMM", { locale: ptBR }) : 'Agora'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate mb-1" title={link.originalUrl}>
                        {link.originalUrl.length > 20 ? link.originalUrl.substring(0, 20) + '...' : link.originalUrl}
                      </h3>
                      <p className="text-zinc-500 text-xs flex items-center gap-1.5 truncate" title={`${window.location.origin}/r/${link.shortCode}`}>
                        <ExternalLink className="w-3 h-3" />
                        {`${window.location.origin}/r/${link.shortCode}`.length > 30 ? `${window.location.origin}/r/${link.shortCode}`.substring(0, 30) + '...' : `${window.location.origin}/r/${link.shortCode}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center px-4 border-l border-r border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter mb-0.5">Cliques</p>
                        <div className="flex items-center gap-1.5 justify-center">
                          <BarChart3 className="w-4 h-4 text-[#CCFF00]" />
                          <span className="text-lg font-black text-white">{link.clicks}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openQrModal(link)}
                          className="btn btn-secondary p-3 rounded-xl hover:text-purple-400"
                          title="Ver QR Code"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(link)}
                          className="btn btn-secondary p-3 rounded-xl hover:text-blue-400"
                          title="Editar"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(link.shortCode)}
                          className="btn btn-secondary p-3 rounded-xl hover:text-[#CCFF00]"
                          title="Copiar"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(link.id)}
                          className="btn btn-secondary p-3 rounded-xl hover:text-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-lg bg-[#141414] border-zinc-800 shadow-2xl relative">
            <button
              onClick={closeEditModal}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#CCFF00]" />
              Editar Link
            </h2>

            {editError && (
              <div className="bg-red-900/20 border border-red-900 text-red-500 p-3 rounded-lg mb-6 text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateLink} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">URL Original (Destino)</label>
                <input
                  type="text"
                  className="input bg-zinc-900/50 border-zinc-800"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Código Curto Customizado</label>
                <div className="flex items-center">
                  <span className="bg-zinc-800 border border-zinc-800 border-r-0 rounded-l-[8px] px-4 py-[15px] text-zinc-400 text-sm">
                    {window.location.host}/r/
                  </span>
                  <input
                    type="text"
                    className="input bg-zinc-900/50 border-zinc-800 rounded-l-none"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">Apenas letras, números, hifens e underlines. Entre 4 e 20 caracteres.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn btn-secondary flex-1 border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-sm bg-[#141414] border-zinc-800 shadow-2xl text-center relative">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Excluir Link?</h2>
            <p className="text-zinc-400 text-sm mb-6">Essa ação não pode ser desfeita. O link deixará de funcionar imediatamente.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-secondary flex-1 border-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="btn flex-1 bg-red-500 hover:bg-red-600 text-white border-none"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de QR Code */}
      {isQrModalOpen && qrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-sm bg-[#141414] border-zinc-800 shadow-2xl text-center relative">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
              <QrCode className="w-6 h-6 text-[#CCFF00]" />
              QR Code
            </h2>
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/r/' + qrLink.shortCode)}`} 
                  alt="QR Code" 
                  className="w-[200px] h-[200px]"
                />
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-4 truncate">
              {window.location.origin}/r/{qrLink.shortCode}
            </p>
            <button
              onClick={() => {
                copyToClipboard(qrLink.shortCode);
              }}
              className="btn btn-primary w-full"
            >
              Copiar Link
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#CCFF00] text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(204,255,0,0.3)] animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
