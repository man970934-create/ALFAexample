import { useEffect, useRef, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Claim, Company, Insight, Origin, Source } from "./types";
import { ApiError } from "./api";
import s from "./App.module.css";
export const date = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
export const originLabels: Record<Origin, string> = {
  fact: "Подтверждённый факт",
  bank: "Аналитика Альфа-Банка",
  ai: "Вывод AI",
};
export const impactLabels = {
  risk: "Риск",
  opportunity: "Возможность",
  mixed: "Смешанное влияние",
};
export function OriginLabel({ origin }: { origin: Origin }) {
  return (
    <span className={`${s.origin} ${s[origin]}`}>
      {origin === "ai" ? (
        <Sparkles size={13} />
      ) : origin === "bank" ? (
        <BookOpen size={13} />
      ) : (
        <Check size={13} />
      )}
      {originLabels[origin]}
    </span>
  );
}
export function Skeleton() {
  return (
    <div role="status" aria-label="Загрузка данных" className={s.skeletons}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={s.skeleton}>
          <div />
          <div />
          <div />
        </div>
      ))}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const denied = error instanceof ApiError && error.status === 403;
  const missing = error instanceof ApiError && error.status === 404;
  return (
    <div role="alert" className={s.empty}>
      <AlertCircle size={28} />
      <h2>
        {denied
          ? "Нет доступа"
          : missing
            ? "Разбор не найден"
            : "Не удалось загрузить данные"}
      </h2>
      <p>{error.message}</p>
      <button onClick={retry}>Повторить запрос</button>
    </div>
  );
}
export function Drawer({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const focused = document.activeElement as HTMLElement;
    dialog.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = prev;
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={s.drawer}
      aria-labelledby="drawer-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
    >
      <div className={s.drawerInner}>
        <div className={s.drawerHead}>
          <h2 id="drawer-title">{title}</h2>
          <button
            aria-label="Закрыть панель"
            className={s.iconButton}
            onClick={close}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function CompanyPanel({
  company,
  close,
}: {
  company: Company;
  close: () => void;
}) {
  return (
    <Drawer title="Контекст компании" close={close}>
      <span className={s.demoBadge}>Синтетическая компания</span>
      <h2>{company.name}</h2>
      <p className={s.muted}>ID: {company.id}</p>
      <dl className={s.profile}>
        <dt>Отрасль</dt>
        <dd>{company.industry}</dd>
        <dt>Регион</dt>
        <dd>{company.region}</dd>
        <dt>Годовая выручка</dt>
        <dd>
          {company.revenue === null
            ? "Данные отсутствуют"
            : new Intl.NumberFormat("ru-RU", {
                style: "currency",
                currency: "RUB",
                maximumFractionDigits: 0,
              }).format(company.revenue)}
        </dd>
      </dl>
      <h3>Банковские продукты</h3>
      <div className={s.productList}>
        {company.products.map((product) => (
          <div key={product.name}>
            <span>{product.name}</span>
            <span
              className={product.status === "present" ? s.positive : s.muted}
            >
              {product.status === "present"
                ? "Есть"
                : product.status === "absent"
                  ? "Отсутствует"
                  : "Нет данных"}
            </span>
          </div>
        ))}
      </div>
      <h3>Внешнеторговые признаки</h3>
      <p>{company.trade}</p>
      <h3>Использованные признаки</h3>
      <ul className={s.plainList}>
        {company.features.map((feature) => (
          <li key={feature.id}>{feature.text}</li>
        ))}
      </ul>
      <div className={s.notice}>
        <strong>Чего пока не хватает</strong>
        <ul>
          {company.missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        Неизвестные значения не считаются нулевыми.
      </div>
    </Drawer>
  );
}
export function SourcePanel({
  source,
  claim,
  close,
}: {
  source: Source;
  claim: string;
  close: () => void;
}) {
  const safe = source.url && /^https?:\/\//i.test(source.url);
  return (
    <Drawer title="Основание утверждения" close={close}>
      {source.synthetic && (
        <span className={s.demoBadge}>Демонстрационный материал</span>
      )}
      <h2>{source.title}</h2>
      <p className={s.muted}>
        {source.type === "company"
          ? "Признак компании"
          : source.type === "bank"
            ? "Макет аналитики банка"
            : "Новостной материал"}{" "}
        · {date(source.date)}
      </p>
      <h3>Подтверждающий фрагмент</h3>
      <blockquote>{source.excerpt}</blockquote>
      <h3>Связанное утверждение</h3>
      <p>{claim}</p>
      {safe ? (
        <a
          className={s.textLink}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Открыть оригинал <ArrowUpRight size={16} />
        </a>
      ) : (
        <p className={s.notice}>
          Оригинал не опубликован: это синтетический материал для демонстрации
          интерфейса.
        </p>
      )}
    </Drawer>
  );
}
export function ClaimView({
  claim,
  sources,
  open,
}: {
  claim: Claim;
  sources: Source[];
  open: (source: Source, claim: string) => void;
}) {
  return (
    <div className={s.claim}>
      <OriginLabel origin={claim.origin} />
      <p>{claim.text}</p>
      <div className={s.refs}>
        {claim.sourceIds.map((id) => {
          const source = sources.find((item) => item.id === id);
          return (
            source && (
              <button key={id} onClick={() => open(source, claim.text)}>
                <FileText size={12} />
                {source.type === "company"
                  ? source.title.split(" · ")[1]
                  : source.type === "bank"
                    ? "Материал банка"
                    : "Источник события"}
              </button>
            )
          );
        })}
      </div>
    </div>
  );
}
export function InsightCard({
  insight,
  to,
  compact = false,
}: {
  insight: Insight;
  to: string;
  compact?: boolean;
}) {
  return (
    <article className={`${s.card} ${compact ? s.compact : ""}`}>
      <div className={s.cardMeta}>
        <span>{insight.topic}</span>
        <span>·</span>
        <time dateTime={insight.date}>{date(insight.date)}</time>
        <span
          className={`${s.significance} ${insight.significance === "high" ? s.high : ""}`}
        >
          {insight.significance === "high"
            ? "Высокая"
            : insight.significance === "medium"
              ? "Средняя"
              : "Низкая"}{" "}
          значимость
        </span>
      </div>
      <h2>
        <Link to={to}>{insight.title}</Link>
      </h2>
      <div className={s.factText}>
        <OriginLabel origin="fact" />
        <p>{insight.fact.text}</p>
      </div>
      {!compact && (
        <div className={s.why}>
          <div>
            <Sparkles size={16} />
            <strong>Почему важно для вас</strong>
            <span>Вывод AI</span>
          </div>
          <p>{insight.why.text}</p>
          <p className={s.effect}>{insight.effect.text}</p>
        </div>
      )}
      <div className={s.cardFooter}>
        <div className={s.tags}>
          <span className={`${s.impact} ${s[insight.impact]}`}>
            {impactLabels[insight.impact]}
          </span>
          <span>
            <FileText size={14} />
            {
              insight.sources.filter((source) => source.type !== "company")
                .length
            }{" "}
            ист.
          </span>
          {insight.bank && (
            <span>
              <BookOpen size={14} />
              Аналитика банка · демо
            </span>
          )}
        </div>
        <Link className={s.textLink} to={to}>
          Посмотреть разбор <ChevronRight size={16} />
        </Link>
      </div>
    </article>
  );
}
