export enum Role {
  RALLY = "Rally",
  GARRISON = "Garrison",
  FIELD = "Field",
}

export enum AooTeam {
  NONE = "None",
  TEAM_1 = "Team 1",
  TEAM_2 = "Team 2",
}

export interface User {
  governorId: string;
  role: Role;
  aooTeam: AooTeam;
  isAdmin?: boolean; // ✅ allow admin flag for dashboard access
}

export interface PlayerStat {
  governorId: string;
  name: string;
  power: number;
  kills: number;
  deaths: number;
  t5Kills: number;
  dkp: number;
}

export interface GameEvent {
  id: string;
  title: string;
  date: string; // ISO string
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string | number | Date; // store Firestore timestamp or string
}

export interface Absence {
  id: string;
  governorId: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  reason: string;
}

export type StatsData = {
  [kvkName: string]: PlayerStat[];
};

export type View =
  | "LOGIN"
  | "WELCOME"
  | "DASHBOARD"
  | "PROFILE"
  | "EVENTS"
  | "ANNOUNCEMENTS"
  | "CALENDAR"
  | "STATS"
  | "AOO_TEAMS";
