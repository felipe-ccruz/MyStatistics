/**
 * Regras de texto livre vindo do usuário. Puras — sem banco, sem env.
 */

/**
 * `true` se o texto tem caractere de controle (U+0000 a U+001F, ou U+007F), inclusive quebra de
 * linha e tab. O byte nulo, em especial, o Postgres recusa (22021): sem barrar antes, a resposta
 * seria 500. Nome, unidade e matéria são uma linha só, então nenhum controle é aceito.
 * (Loop em vez de regex: o lint barra caractere de controle dentro de regex.)
 */
export function hasControlCharacter(text: string): boolean {
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}
