import { addDays, eachDayOfInterval, format, parseISO } from "date-fns";

/**
 * Dia de calendário (`"YYYY-MM-DD"`) do server. Toda regra que fala em "hoje" (data padrão de
 * atividade e de registro, progresso, resumos) usa ESTE relógio: um lugar só para trocar o fuso.
 *
 * Fora o `todayISO`, as funções daqui são puras: recebem e devolvem strings `"YYYY-MM-DD"`.
 * O `parseISO` lê a data como meia-noite local e o `format` a devolve no mesmo fuso, então a
 * aritmética é de dias de calendário (sem pular nem repetir dia na troca de horário de verão).
 */

const DAY_FORMAT = "yyyy-MM-dd";

/** Dia de hoje no formato "YYYY-MM-DD" (horário local do servidor). */
export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `day` deslocado em `amount` dias (negativo volta no tempo). */
export function addDaysISO(day: string, amount: number): string {
  return format(addDays(parseISO(day), amount), DAY_FORMAT);
}

/** Os `count` dias que terminam em `lastDay` (inclusive), do mais antigo até `lastDay`. */
export function daysEndingOn(lastDay: string, count: number): string[] {
  if (count <= 0) return [];
  const end = parseISO(lastDay);
  return eachDayOfInterval({ start: addDays(end, -(count - 1)), end }).map((date) => format(date, DAY_FORMAT));
}
