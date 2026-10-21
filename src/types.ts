export type Role = "ceo" | "cfo" | "treasurer";
export type Impact = "risk" | "opportunity" | "mixed";
export type Origin = "fact" | "bank" | "ai";
export type Scenario =
  "normal" | "empty" | "error" | "partial" | "forbidden" | "failed";
export interface Company {
  id: string;
  name: string;
  industry: string;
  region: string;
  revenue: number | null;
  products: { name: string; status: "present" | "absent" | "unknown" }[];
  trade: string;
  features: { id: string; text: string }[];
  missing: string[];
}
export interface Source {
  id: string;
  title: string;
  type: "news" | "bank" | "company";
  date: string;
  excerpt: string;
  synthetic: boolean;
  url?: string;
}
export interface Claim {
  id: string;
  text: string;
  origin: Origin;
  sourceIds: string[];
}
export interface Insight {
  id: string;
  eventId: string;
  companyId: string;
  title: string;
  date: string;
  topic: string;
  impact: Impact;
  significance: "high" | "medium" | "low";
  score: number;
  fact: Claim;
  why: Claim;
  effect: Claim;
  risks: Claim[];
  opportunities: Claim[];
  actions: Claim[];
  bank: Claim | null;
  sources: Source[];
  limitations: string[];
}
export interface Feed {
  items: Insight[];
  updatedAt: string;
  partial: boolean;
  total: number;
}
export interface Filters {
  role: Role;
  period: string;
  impact: string;
  search: string;
  scenario: Scenario;
}
export interface Message {
  id: string;
  author: "user" | "assistant";
  text: string;
  sourceIds: string[];
  createdAt: string;
}
export interface Analysis {
  id: string;
  companyId: string;
  status: "queued" | "running" | "completed" | "partial" | "failed";
  stages: { title: string; state: "pending" | "active" | "done" | "failed" }[];
  limitations: string[];
}
