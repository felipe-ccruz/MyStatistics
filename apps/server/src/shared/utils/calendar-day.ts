/**
 * Dia de calendário (`"YYYY-MM-DD"`) do server. Toda regra que fala em "hoje" (data padrão de
 * atividade e de registro, progresso, resumos) usa ESTE relógio: um lugar só para trocar o fuso.
 */

/** Dia de hoje no formato "YYYY-MM-DD" (horário local do servidor). */
export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
