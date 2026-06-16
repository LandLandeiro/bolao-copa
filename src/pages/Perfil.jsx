import { useAuth } from '../context/AuthContext'
import NomeForm from '../components/NomeForm'

// Tela de perfil: editar o próprio nick. Mesmo NomeForm/validação do gate de
// 1º login — aqui só atualiza o nome (a flag nome_escolhido já é true).
export default function Perfil() {
  const { profile, salvarPerfil } = useAuth()

  return (
    <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">PERFIL</h1>
        <p className="mt-2 text-sm text-slate">
          Seu nome no ranking. Os outros te enxergam por ele.
        </p>
      </header>

      <section className="bg-cloud rounded-lg border border-line shadow-soft p-5 sm:p-6 max-w-[420px]">
        <NomeForm
          idCampo="nome-perfil"
          valorInicial={profile?.nome ?? ''}
          textoBotao="salvar nome"
          textoOk="nome salvo!"
          onSalvar={(nome) => salvarPerfil({ nome })}
        />
      </section>
    </main>
  )
}
