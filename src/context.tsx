import { createContext, useContext } from "react";
import { ArrowUpRight, Building2, CircleHelp } from "lucide-react";
import { mocksEnabled } from "./api";
import type { Company, Filters, Role } from "./types";
import s from "./App.module.css";
interface Context {
  company: Company;
  companyId: string;
  filters: Filters;
  setParam: (key: string, value: string) => void;
  href: (path: string) => string;
  openProfile: () => void;
}
export const AppContext = createContext<Context | null>(null);
export function useApp() {
  return useContext(AppContext)!;
}
export const roleLabels: Record<Role, string> = {
  ceo: "Генеральный директор",
  cfo: "Финансовый директор",
  treasurer: "Руководитель казначейства",
};
export function ContextBar() {
  const { company, openProfile } = useApp();
  return (
    <div className={s.contextBar}>
      <Building2 size={20} />
      <div>
        <strong>{company.name}</strong>
        <span>
          {company.industry} · {company.region}
        </span>
      </div>
      <button onClick={openProfile}>
        Контекст компании <ArrowUpRight size={15} />
      </button>
    </div>
  );
}
export function DemoControls() {
  const { filters, setParam } = useApp();
  return (
    mocksEnabled && (
      <details className={s.demoControls}>
        <summary>
          <CircleHelp size={15} />
          Сценарии демонстрации
        </summary>
        <label>
          Состояние API
          <select
            value={filters.scenario}
            onChange={(event) => setParam("scenario", event.target.value)}
          >
            <option value="normal">Обычный сценарий</option>
            <option value="partial">Частичный результат</option>
            <option value="error">Ошибка ленты один раз</option>
            <option value="empty">Пустая лента</option>
            <option value="forbidden">Нет доступа</option>
            <option value="failed">Сбой подготовки анализа</option>
          </select>
        </label>
        <p>
          Переключатели моделируют ответы API и не управляют правами доступа.
        </p>
      </details>
    )
  );
}
