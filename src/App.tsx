import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  House,
  LockKeyhole,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { api, mocksEnabled } from "./api";
import type { Filters, Role, Scenario } from "./types";
import { CompanyPanel, ErrorState, Skeleton } from "./ui";
import { Home, Analytics, Detail } from "./pages";
import s from "./App.module.css";
import { AppContext, roleLabels } from "./context";
function Layout() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const companyId = params.get("companyId") || "manufacturing";
  const role = params.get("role") as Role;
  const scenario = params.get("scenario") as Scenario;
  const filters: Filters = {
    role: Object.hasOwn(roleLabels, role) ? role : "cfo",
    period: ["1", "7", "30"].includes(params.get("period") || "")
      ? params.get("period")!
      : "30",
    impact: ["risk", "opportunity", "mixed"].includes(
      params.get("impact") || "",
    )
      ? params.get("impact")!
      : "all",
    search: params.get("search") || "",
    scenario:
      mocksEnabled &&
      ["empty", "error", "partial", "forbidden", "failed"].includes(scenario)
        ? scenario
        : "normal",
  };
  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: ({ signal }) => api.companies(signal),
  });
  const me = useQuery({
    queryKey: ["me"],
    queryFn: ({ signal }) => api.me(signal),
  });
  const profile = useQuery({
    queryKey: ["company", companyId],
    queryFn: ({ signal }) => api.profile(companyId, signal),
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement;
    closeMenuRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    const onResize = () => {
      if (window.innerWidth > 800) setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      previous?.focus();
    };
  }, [menu]);
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "companyId") {
      next.delete("analysisId");
      setProfileOpen(false);
      if (location.pathname.includes("/insights/")) {
        navigate(`/analytics?${next}`);
        return;
      }
    }
    setParams(next, { replace: key === "search" });
  }
  function href(path: string) {
    const next = new URLSearchParams(params);
    next.set("companyId", companyId);
    next.set("role", filters.role);
    next.delete("analysisId");
    return `${path}?${next}`;
  }
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#main">
        К содержимому
      </a>
      {menu && (
        <button
          className={s.navScrim}
          aria-label="Закрыть навигацию"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`${s.sidebar} ${menu ? s.sidebarOpen : ""}`}>
        <Link className={s.brand} to={href("/")}>
          <span className={s.alfa}>А</span>
          <span>
            Альфа-Бизнес<small>Для крупного бизнеса</small>
          </span>
        </Link>
        <button
          className={`${s.iconButton} ${s.closeNav}`}
          ref={closeMenuRef}
          aria-label="Закрыть меню"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <div className={s.workspaceLabel}>РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav aria-label="Основная навигация">
          <NavLink
            end
            to={href("/")}
            onClick={() => setMenu(false)}
            className={({ isActive }) => (isActive ? s.activeNav : "")}
          >
            <House size={19} />
            Главная
          </NavLink>
          <NavLink
            to={href("/analytics")}
            onClick={() => setMenu(false)}
            className={({ isActive }) => (isActive ? s.activeNav : "")}
          >
            <ChartNoAxesCombined size={19} />
            Бизнес-аналитика
            <span className={s.newDot} />
          </NavLink>
        </nav>
        <div className={s.unavailable}>
          <LockKeyhole size={15} />
          <span>
            Другие банковские сервисы<small>Недоступны в прототипе</small>
          </span>
        </div>
        <div className={s.sidebarBottom}>
          <ShieldCheck size={21} />
          <strong>
            {mocksEnabled ? "Демонстрационный стенд" : "Подключённый API"}
          </strong>
          <p>
            {mocksEnabled
              ? "Синтетические данные. Без доступа к банковским системам."
              : "Данные поступают от настроенного сервера."}
          </p>
          <div className={s.sidebarVersion}>
            Бизнес-аналитика <span>1.0</span>
          </div>
        </div>
      </aside>
      <div className={s.workspace} inert={menu}>
        <header className={s.header}>
          <button
            className={`${s.iconButton} ${s.menuButton}`}
            aria-label="Открыть меню"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
          <div className={s.companySelect}>
            <Building2 size={20} />
            <label>
              <span>Компания</span>
              <select
                aria-label="Компания"
                value={companyId}
                onChange={(event) => setParam("companyId", event.target.value)}
              >
                {!companies.data?.some((c) => c.id === companyId) && (
                  <option value={companyId}>
                    {companies.isPending ? "Загрузка…" : "Неизвестная компания"}
                  </option>
                )}
                {companies.data?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <ChevronDown size={15} />
          </div>
          <div className={s.headerRight}>
            <span className={s.demoBadge}>{mocksEnabled ? "Демо" : "API"}</span>
            <div className={s.user}>
              <span className={s.avatar}>АМ</span>
              <span>
                {me.data?.name || "Пользователь"}
                <small>{me.data?.title || "Бизнес-аналитика"}</small>
              </span>
            </div>
          </div>
        </header>
        <main id="main" className={s.main}>
          {companies.isError && (
            <ErrorState
              error={companies.error}
              retry={() => {
                void companies.refetch();
              }}
            />
          )}
          {profile.isPending ? (
            <Skeleton />
          ) : profile.isError ? (
            <ErrorState
              error={profile.error}
              retry={() => {
                void profile.refetch();
              }}
            />
          ) : (
            <AppContext.Provider
              value={{
                company: profile.data,
                companyId,
                filters,
                setParam,
                href,
                openProfile: () => setProfileOpen(true),
              }}
            >
              <Outlet key={companyId} />
            </AppContext.Provider>
          )}
          <footer className={s.footer}>
            <span>Альфа-Бизнес · Прототип для хакатона</span>
            <span>
              {mocksEnabled
                ? "Все материалы синтетические"
                : "Сведения предоставлены API"}
            </span>
          </footer>
        </main>
      </div>
      {profileOpen && profile.data && (
        <CompanyPanel
          company={profile.data}
          close={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="analytics/insights/:insightId" element={<Detail />} />
        <Route
          path="*"
          element={
            <div className={s.empty}>
              <h1>Страница не найдена</h1>
              <Link to="/">Вернуться на главную</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
