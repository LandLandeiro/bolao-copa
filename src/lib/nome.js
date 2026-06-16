// Validação do nick — única regra, usada nas duas features (editar nome e
// escolher no 1º login). Não há constraint no banco; a validação é no cliente.
export const NOME_MIN = 3
export const NOME_MAX = 30

// Normaliza (trim) e valida. Retorna { ok, nome, erro }: `nome` já vem limpo
// pra salvar, `erro` é a mensagem pronta pra UI quando ok === false.
export function validarNome(bruto) {
  const nome = (bruto ?? '').trim()
  if (nome.length < NOME_MIN) {
    return { ok: false, nome, erro: `Use pelo menos ${NOME_MIN} caracteres.` }
  }
  if (nome.length > NOME_MAX) {
    return { ok: false, nome, erro: `No máximo ${NOME_MAX} caracteres.` }
  }
  return { ok: true, nome, erro: null }
}
