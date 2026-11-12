/**
 * Progresso do jogador (gamificação, decisão D5 do plans/mvp-tasks.md).
 *
 * Arquivo PURO (sem Elysia/TypeBox). As constantes das regras moram aqui para que o
 * server (que calcula o progresso de verdade) e o front (que só mostra uma prévia no
 * modal "Log activity" e o texto do "System rules") usem a mesma fonte.
 */
import type { ActivityCategory } from "./activity";

/** XP por minuto de atividade, por categoria. XP do dia = `floor(minutos × taxa)`, por categoria. */
export const XP_RATE: Record<ActivityCategory, number> = { study: 1, exercise: 1.2 };

/** Meta diária da daily quest, em minutos, por categoria. */
export const DAILY_GOAL_MINUTES: Record<ActivityCategory, number> = { study: 90, exercise: 45 };

/** XP extra por bater a meta diária de uma categoria. */
export const DAILY_GOAL_REWARD: Record<ActivityCategory, number> = { study: 50, exercise: 40 };

/** XP extra por bater as metas de todas as categorias no mesmo dia. */
export const FULL_CLEAR_BONUS = 100;

/** XP necessário para subir do nível `level` para o seguinte. O jogador começa no nível 1, com 0 XP. */
export const xpToNextLevel = (level: number): number => 100 * level + 200;

/** Ranks em ordem crescente: E (1–4) · D (5–9) · C (10–14) · B (15–19) · A (20–29) · S (30+). */
export const RANKS = ["E", "D", "C", "B", "A", "S"] as const;

export type Rank = (typeof RANKS)[number];

/** Nível mínimo de cada rank. O rank é o maior cujo nível mínimo o jogador já alcançou. */
export const RANK_MIN_LEVEL: Record<Rank, number> = { E: 1, D: 5, C: 10, B: 15, A: 20, S: 30 };

/** Duração de referência de uma sessão de estudo, em minutos: FOCUS = duração média de uma atividade study ÷ este valor. */
export const FOCUS_SESSION_MINUTES = 75;

/** Janela dos atributos, em dias de calendário (incluindo hoje): INT, STR, FOCUS e DISCIPLINE são médias deste período. */
export const ATTRIBUTES_WINDOW_DAYS = 30;

/** Classe pelo atributo dominante entre INT e STR; empate → "Adventurer". */
export const CLASS_NAMES = ["Arcane Student", "Iron Warrior", "Adventurer"] as const;

export type ClassName = (typeof CLASS_NAMES)[number];

/** Uma meta da daily quest de hoje. */
export type DailyQuestGoal = {
  category: ActivityCategory;
  targetMinutes: number;
  doneMinutes: number;
  reward: number;
  completed: boolean;
};

/**
 * Resposta de `GET /api/progress`. Tudo calculado no server (D6) a partir das
 * atividades do usuário logado; "hoje" é o dia de calendário do server (`today`).
 *
 * Valores de status e de atributos são inteiros de 0 a 100 (arredondados e limitados a 100).
 */
export type Progress = {
  /** Dia de calendário usado como "hoje" no cálculo, `"YYYY-MM-DD"`. */
  today: string;
  level: number;
  /** XP acumulado dentro do nível atual. */
  xpCurrent: number;
  /** XP do nível atual até o próximo (`xpToNextLevel(level)`). */
  xpNeeded: number;
  /** XP de toda a história. */
  xpTotal: number;
  rank: Rank;
  className: ClassName;
  streak: {
    /** Dias seguidos com pelo menos uma atividade. Se hoje ainda não tem registro, conta a partir de ontem. */
    current: number;
    /** Maior sequência da história. */
    best: number;
    /** Os últimos 7 dias, do mais antigo até hoje (7 itens). */
    week: { date: string; active: boolean }[];
  };
  status: {
    /** Study de hoje ÷ 90 min. */
    mp: number;
    /** Média de exercise nos últimos 7 dias ÷ 45 min. */
    sta: number;
    /** % das metas da daily quest de hoje concluídas. */
    mood: number;
  };
  /** Médias dos últimos `ATTRIBUTES_WINDOW_DAYS` dias (incluindo hoje). */
  attributes: {
    /** Minutos de study por dia ÷ 90. */
    int: number;
    /** Minutos de exercise por dia ÷ 45. */
    str: number;
    /** Duração média de uma atividade study ÷ 75. */
    focus: number;
    /** % dos dias com as duas categorias. */
    discipline: number;
    /** Os números por trás dos atributos, para a descrição curta de cada um. Vêm com fração: o front formata. */
    details: {
      studyMinutesPerDay: number;
      exerciseMinutesPerDay: number;
      averageStudySessionMinutes: number;
      daysWithBothCategories: number;
    };
  };
  dailyQuest: {
    /** Uma meta por categoria, na ordem de `ACTIVITY_CATEGORIES`. */
    goals: DailyQuestGoal[];
    /** O bônus de "full clear" (`FULL_CLEAR_BONUS`). */
    bonus: number;
    allCompleted: boolean;
  };
};
