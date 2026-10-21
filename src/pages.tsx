import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  X,
} from "lucide-react";
import { api, mocksEnabled } from "./api";
import { ContextBar, DemoControls, roleLabels, useApp } from "./context";
import {
  ClaimView,
  date,
  dateTime,
  ErrorState,
  InsightCard,
  Skeleton,
  SourcePanel,
} from "./ui";
import type { Insight, Source } from "./types";
import s from "./App.module.css";
function useFeed() {
  const { companyId, filters } = useApp();
  return useQuery({
    queryKey: ["feed", companyId, filters],
    queryFn: ({ signal }) => api.feed(companyId, filters, signal),
  });
}
export function Home() {
  const { company, href, openProfile } = useApp();
  const feed = useFeed();
  return (
    <>
      <div className={s.breadcrumb}>Рабочее пространство</div>
      <div className={s.pageTitle}>
        <div>
          <h1>Главная</h1>
          <p>Всё важное для вашего бизнеса</p>
        </div>
        <span className={s.today}>{date("2026-10-21")}</span>
      </div>
      <section className={s.hero}>
        <div className={s.heroIcon}>
          <ChartMark />
        </div>
        <div className={s.heroContent}>
          <span className={s.eyebrow}>ПЕРСОНАЛЬНЫЙ ОБЗОР</span>
          <h2>Бизнес-аналитика</h2>
          <p>
            От событий — к решениям.
            <br />
            Новости и их возможное влияние на «{company.name}».
          </p>
          <Link className={s.primary} to={href("/analytics")}>
            Открыть аналитику <ArrowRight size={17} />
          </Link>
        </div>
        <div className={s.heroAside}>
          <div>
            <span>01</span>
            <strong>Событие</strong>
            <small>Что изменилось на рынке</small>
          </div>
          <div>
            <span>02</span>
            <strong>Ваш контекст</strong>
            <small>Почему это касается компании</small>
          </div>
          <div>
            <span>03</span>
            <strong>Основания</strong>
            <small>Источники каждого вывода</small>
          </div>
        </div>
      </section>
      <div className={s.sectionTitle}>
        <h2>В фокусе вашей компании</h2>
        <Link className={s.textLink} to={href("/analytics")}>
          Вся лента <ArrowRight size={15} />
        </Link>
      </div>
      {feed.isPending ? (
        <Skeleton />
      ) : feed.isError ? (
        <ErrorState
          error={feed.error}
          retry={() => {
            void feed.refetch();
          }}
        />
      ) : feed.data.items.length ? (
        <div className={s.homeCards}>
          {feed.data.items.slice(0, 3).map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              compact
              to={href(`/analytics/insights/${insight.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className={s.empty}>
          <h2>Пока нет событий</h2>
          <Link to={href("/analytics")}>Открыть настройки ленты</Link>
        </div>
      )}
      <div className={s.homeBottom}>
        <div>
          <ShieldCheck size={22} />
          <div>
            <h3>Прозрачные основания</h3>
            <p>
              Факты, аналитика банка и выводы AI разделены. У каждого
              утверждения есть источник.
            </p>
          </div>
        </div>
        <div>
          <FileCheck2 size={22} />
          <div>
            <h3>Анализ с учётом вашего бизнеса</h3>
            <p>
              {company.industry}. Доступные признаки и пробелы открыты для
              проверки.
            </p>
            <button className={s.textLink} onClick={openProfile}>
              Посмотреть контекст <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
function ChartMark() {
  return (
    <svg
      width="76"
      height="76"
      viewBox="0 0 76 76"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="42"
        width="14"
        height="27"
        rx="4"
        fill="currentColor"
        opacity=".35"
      />
      <rect
        x="30"
        y="27"
        width="14"
        height="42"
        rx="4"
        fill="currentColor"
        opacity=".6"
      />
      <rect x="55" y="7" width="14" height="62" rx="4" fill="currentColor" />
      <path
        d="M7 26L28 11L42 16L56 3"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ProcessInfo() {
  return (
    <details className={s.processInfo}>
      <summary>
        <ShieldCheck size={16} />
        Как подготовлен анализ <ChevronDown size={15} />
      </summary>
      <ol>
        <li>Получены доступные признаки выбранной компании.</li>
        <li>События отобраны и упорядочены с учётом компании и роли.</li>
        <li>Подобраны демонстрационные аналитические материалы.</li>
        <li>
          Утверждения связаны с источниками и признаками; пробелы отмечены.
        </li>
      </ol>
      <p>
        Это статусы демонстрационного процесса, а не внутренние рассуждения
        модели. В деморежиме используются готовые сценарии, без парсинга и
        вызовов LLM. Количественные прогнозы при недостатке данных не
        рассчитываются.
      </p>
    </details>
  );
}
function RefreshAnalysis() {
  const { companyId, filters, setParam } = useApp();
  const [params] = useSearchParams();
  const client = useQueryClient();
  const analysisId = params.get("analysisId");
  const start = useMutation({
    mutationFn: () => api.analyses(companyId, filters.scenario),
    onSuccess: (job) => setParam("analysisId", job.id),
  });
  const job = useQuery({
    queryKey: ["analysis", companyId, analysisId],
    enabled: !!analysisId,
    queryFn: ({ signal }) => api.analysis(analysisId!, signal),
    refetchInterval: (query) =>
      ["queued", "running"].includes(query.state.data?.status || "")
        ? 650
        : false,
  });
  const previous = useRef<string | null>(null);
  const current = job.data?.companyId === companyId ? job.data : undefined;
  useEffect(() => {
    if (
      current &&
      ["completed", "partial"].includes(current.status) &&
      previous.current !== current.id
    ) {
      previous.current = current.id;
      void client.invalidateQueries({ queryKey: ["feed", companyId] });
    }
  }, [current, client, companyId]);
  const busy =
    start.isPending ||
    (!!analysisId &&
      (job.isPending || ["queued", "running"].includes(current?.status || "")));
  return (
    <div className={s.refreshWrap}>
      <button
        className={s.refresh}
        disabled={busy}
        onClick={() => start.mutate()}
      >
        <RefreshCw size={16} className={busy ? s.spin : ""} />
        {busy ? "Подготовка анализа…" : "Обновить анализ"}
      </button>
      {start.isError && (
        <p role="alert">
          {start.error.message}{" "}
          <button onClick={() => start.mutate()}>Повторить</button>
        </p>
      )}
      {job.isError && (
        <p role="alert">
          {job.error.message}{" "}
          <button
            onClick={() => {
              void job.refetch();
            }}
          >
            Повторить
          </button>
        </p>
      )}
      {current && (
        <div className={s.job} role="status" aria-live="polite">
          <strong>
            {current.status === "completed"
              ? "Анализ подготовлен"
              : current.status === "partial"
                ? "Анализ подготовлен частично"
                : current.status === "failed"
                  ? "Подготовка прервана"
                  : "Готовим персональный анализ"}
          </strong>
          <ol>
            {current.stages.map((stage) => (
              <li
                key={stage.title}
                className={stage.state === "active" ? s.activeStage : ""}
              >
                {stage.state === "done" ? (
                  <Check size={14} />
                ) : stage.state === "failed" ? (
                  <X size={14} />
                ) : (
                  <Clock3 size={14} />
                )}
                {stage.title}
                <span>
                  {stage.state === "done"
                    ? "Готово"
                    : stage.state === "active"
                      ? "В работе"
                      : stage.state === "failed"
                        ? "Ошибка"
                        : "Ожидание"}
                </span>
              </li>
            ))}
          </ol>
          <p>{current.limitations.join(" ")}</p>
          {["failed", "completed", "partial"].includes(current.status) && (
            <button onClick={() => setParam("analysisId", "")}>
              Скрыть этапы
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export function Analytics() {
  const { filters, setParam, href } = useApp();
  const feed = useFeed();
  const [params, setParams] = useSearchParams();
  return (
    <>
      <div className={s.breadcrumb}>
        <Link to={href("/")}>Главная</Link>
        <span>/</span>Бизнес-аналитика
      </div>
      <div className={s.pageTitle}>
        <div>
          <div className={s.titleLine}>
            <h1>Бизнес-аналитика</h1>
            <span className={s.aiBadge}>
              <Sparkles size={13} />
              AI
            </span>
          </div>
          <p>События рынка в контексте вашего бизнеса</p>
        </div>
        <RefreshAnalysis />
      </div>
      <ContextBar />
      <div className={s.roleRow}>
        <label>
          Ваш фокус
          <select
            aria-label="Демонстрационная роль"
            value={filters.role}
            onChange={(event) => setParam("role", event.target.value)}
          >
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <span>
          <Clock3 size={14} />
          Данные на {feed.data ? dateTime(feed.data.updatedAt) : "…"} МСК
        </span>
      </div>
      <div className={s.analyticsGrid}>
        <section className={s.feedColumn} aria-label="Персональная лента">
          <div className={s.feedHeading}>
            <h2>Персональная лента</h2>
            {feed.data && <span>{feed.data.items.length} событий</span>}
          </div>
          <div className={s.filters}>
            <div className={s.search}>
              <Search size={17} />
              <input
                aria-label="Поиск по событиям"
                placeholder="Поиск по событиям"
                value={filters.search}
                onChange={(event) => setParam("search", event.target.value)}
              />
              {filters.search && (
                <button
                  aria-label="Очистить поиск"
                  onClick={() => setParam("search", "")}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <select
              aria-label="Период"
              value={filters.period}
              onChange={(event) => setParam("period", event.target.value)}
            >
              <option value="1">За сегодня</option>
              <option value="7">За 7 дней</option>
              <option value="30">За 30 дней</option>
            </select>
          </div>
          <div className={s.tabs} aria-label="Тип влияния">
            {[
              ["all", "Все события"],
              ["risk", "Риски"],
              ["opportunity", "Возможности"],
              ["mixed", "Смешанное"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={filters.impact === value}
                className={filters.impact === value ? s.selectedTab : ""}
                onClick={() => setParam("impact", value)}
              >
                {label}
              </button>
            ))}
          </div>
          {feed.isPending ? (
            <Skeleton />
          ) : feed.isError ? (
            <ErrorState
              error={feed.error}
              retry={() => {
                void feed.refetch();
              }}
            />
          ) : (
            <>
              {feed.data.partial && (
                <div className={s.notice}>
                  <CircleAlert size={18} />
                  <div>
                    <strong>Частичный результат</strong>
                    <p>
                      Часть данных компании отсутствует. Выводы содержат
                      ограничения; денежный эффект не рассчитан.
                    </p>
                  </div>
                </div>
              )}
              {feed.data.items.length ? (
                <div className={s.feedCards}>
                  {feed.data.items.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      to={href(`/analytics/insights/${insight.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className={s.empty}>
                  <Search size={28} />
                  <h2>
                    {feed.data.total === 0
                      ? "Пока нет событий для компании"
                      : "По вашему запросу ничего не найдено"}
                  </h2>
                  <p>
                    {feed.data.total === 0
                      ? "Обновите анализ или выберите другой демосценарий."
                      : "Попробуйте другой запрос, период или тип влияния."}
                  </p>
                  {feed.data.total > 0 && (
                    <button
                      onClick={() => {
                        const next = new URLSearchParams(params);
                        next.delete("search");
                        next.delete("impact");
                        next.delete("period");
                        setParams(next);
                      }}
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
        <aside className={s.rightRail}>
          <div className={s.railCard}>
            <span className={s.eyebrow}>НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</span>
            <h3>
              Отделяйте событие
              <br />
              от его интерпретации
            </h3>
            <div className={s.legend}>
              <span className={s.legendIcon}>
                <Check size={16} />
              </span>
              <div>
                <strong>Факты</strong>
                <p>Что сообщает источник</p>
              </div>
            </div>
            <div className={s.legend}>
              <span className={s.legendIcon}>
                <BookOpen size={16} />
              </span>
              <div>
                <strong>Позиция банка</strong>
                <p>Отдельный аналитический материал</p>
              </div>
            </div>
            <div className={s.legend}>
              <span className={s.legendIcon}>
                <Sparkles size={16} />
              </span>
              <div>
                <strong>Вывод AI</strong>
                <p>Связь с вашей компанией</p>
              </div>
            </div>
            <p className={s.railNote}>
              В деморежиме все три слоя синтетические. Материалы не являются
              рекомендацией банка.
            </p>
          </div>
          <div className={s.railCard}>
            <TrendingUp size={22} />
            <h3>
              Один рынок.
              <br />
              Разный эффект.
            </h3>
            <p>
              Смените компанию или роль — приоритеты и объяснения в ленте
              изменятся.
            </p>
          </div>
          <ProcessInfo />
          <DemoControls />
        </aside>
      </div>
    </>
  );
}
export function Detail() {
  const { insightId = "" } = useParams();
  const { companyId, filters } = useApp();
  return (
    <InsightDetail
      key={`${companyId}-${insightId}-${filters.role}`}
      insightId={insightId}
    />
  );
}
function InsightDetail({ insightId }: { insightId: string }) {
  const { companyId, filters, href } = useApp();
  const query = useQuery({
    queryKey: ["insight", companyId, insightId, filters.role, filters.scenario],
    queryFn: ({ signal }) =>
      api.insight(companyId, insightId, filters.role, filters.scenario, signal),
  });
  const [selected, setSelected] = useState<{
    source: Source;
    claim: string;
  } | null>(null);
  const open = (source: Source, claim: string) =>
    setSelected({ source, claim });
  const feedback = useMutation({
    mutationFn: (useful: boolean) => api.feedback(companyId, insightId, useful),
  });
  return (
    <>
      <Link className={s.back} to={href("/analytics")}>
        <ArrowLeft size={16} />К персональной ленте
      </Link>
      {query.isPending ? (
        <Skeleton />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <>
          <div className={s.detailHeading}>
            <div className={s.cardMeta}>
              {query.data.topic}
              <span>·</span>
              {date(query.data.date)}
              <span>·</span>Демонстрационный материал
            </div>
            <h1>{query.data.title}</h1>
          </div>
          <ContextBar />
          <div className={s.detailGrid}>
            <article className={s.detailArticle}>
              <section>
                <h2>Что произошло</h2>
                <ClaimView
                  claim={query.data.fact}
                  sources={query.data.sources}
                  open={open}
                />
              </section>
              <section>
                <h2>Почему это важно вашей компании</h2>
                <ClaimView
                  claim={query.data.why}
                  sources={query.data.sources}
                  open={open}
                />
                <ClaimView
                  claim={query.data.effect}
                  sources={query.data.sources}
                  open={open}
                />
              </section>
              <div className={s.riskOpportunity}>
                <section>
                  <h2>
                    <CircleAlert size={18} />
                    Возможные риски
                  </h2>
                  {query.data.risks.map((claim) => (
                    <ClaimView
                      key={claim.id}
                      claim={claim}
                      sources={query.data.sources}
                      open={open}
                    />
                  ))}
                </section>
                <section>
                  <h2>
                    <TrendingUp size={18} />
                    Возможности
                  </h2>
                  {query.data.opportunities.map((claim) => (
                    <ClaimView
                      key={claim.id}
                      claim={claim}
                      sources={query.data.sources}
                      open={open}
                    />
                  ))}
                </section>
              </div>
              <section>
                <h2>Что стоит рассмотреть</h2>
                {query.data.actions.map((claim) => (
                  <ClaimView
                    key={claim.id}
                    claim={claim}
                    sources={query.data.sources}
                    open={open}
                  />
                ))}
              </section>
              <section className={s.bankSection}>
                <div className={s.bankTitle}>
                  <span className={s.miniAlfa}>А</span>
                  <h2>Позиция Альфа-Банка</h2>
                </div>
                <p className={s.muted}>
                  Демонстрационный материал · не реальная позиция банка
                </p>
                {query.data.bank ? (
                  <ClaimView
                    claim={query.data.bank}
                    sources={query.data.sources}
                    open={open}
                  />
                ) : (
                  <p>Подходящий аналитический материал не найден</p>
                )}
              </section>
              <section>
                <h2>Источники и ограничения анализа</h2>
                <div className={s.sourceList}>
                  {query.data.sources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() =>
                        open(
                          source,
                          [
                            query.data.fact,
                            query.data.why,
                            query.data.bank,
                          ].find((claim) =>
                            claim?.sourceIds.includes(source.id),
                          )?.text || query.data.effect.text,
                        )
                      }
                    >
                      <FileCheck2 size={17} />
                      <span>
                        {source.title}
                        <small>
                          Демонстрационный материал · {date(source.date)}
                        </small>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
                <ul className={s.limitations}>
                  {query.data.limitations.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </section>
              <ProcessInfo />
              <div className={s.feedback}>
                <span>
                  {feedback.isSuccess
                    ? "Спасибо! Оценка принята в деморежиме."
                    : "Этот разбор был полезен?"}
                </span>
                <button
                  aria-label="Полезный разбор"
                  disabled={feedback.isPending || feedback.isSuccess}
                  onClick={() => feedback.mutate(true)}
                >
                  <ThumbsUp size={16} />
                </button>
                <button
                  aria-label="Неполезный разбор"
                  disabled={feedback.isPending || feedback.isSuccess}
                  onClick={() => feedback.mutate(false)}
                >
                  <ThumbsDown size={16} />
                </button>
                {feedback.isError && (
                  <span role="alert">
                    Не удалось сохранить. Попробуйте ещё раз.
                  </span>
                )}
              </div>
            </article>
            <Chat
              key={`${companyId}-${insightId}-${filters.role}`}
              insight={query.data}
              open={open}
            />
          </div>
        </>
      )}
      {selected && (
        <SourcePanel {...selected} close={() => setSelected(null)} />
      )}
    </>
  );
}
function Chat({
  insight,
  open,
}: {
  insight: Insight;
  open: (source: Source, claim: string) => void;
}) {
  const { companyId, filters, company } = useApp();
  const client = useQueryClient();
  const [question, setQuestion] = useState("");
  const [simulateError, setSimulateError] = useState(false);
  const key = ["messages", companyId, insight.id, filters.role];
  const history = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      api.messages(companyId, insight.id, filters.role, signal),
  });
  const [pending, setPending] = useState<{ text: string; id: string } | null>(
    null,
  );
  const ask = useMutation({
    mutationFn: (value: { text: string; id: string }) =>
      api.ask(
        companyId,
        insight.id,
        filters.role,
        value.text,
        value.id,
        simulateError,
      ),
    onSuccess: (messages) => {
      client.setQueryData(key, messages);
      setPending(null);
      setQuestion("");
      setSimulateError(false);
    },
  });
  function send(text: string) {
    if (!text.trim() || ask.isPending || history.isPending || history.isError)
      return;
    const item = { text: text.trim(), id: crypto.randomUUID() };
    setPending(item);
    ask.mutate(item);
  }
  const suggestions = [
    "Какие данные компании повлияли на вывод?",
    "Как это может повлиять на денежный поток?",
    "Что стоит проверить перед принятием решения?",
  ];
  return (
    <aside className={s.chat}>
      <div className={s.chatHead}>
        <span className={s.chatIcon}>
          <Sparkles size={19} />
        </span>
        <div>
          <h2>Обсудить разбор</h2>
          <p>AI-помощник · демо</p>
        </div>
      </div>
      <p className={s.chatContext}>
        {company.name}
        <br />
        <span>{insight.title}</span>
      </p>
      <div className={s.chatBody}>
        <p className={s.muted}>
          Уточните основания и возможное влияние события. Ответы ограничены этим
          разбором.
        </p>
        <div className={s.suggestions}>
          {suggestions.map((text) => (
            <button
              key={text}
              disabled={ask.isPending || history.isPending || history.isError}
              onClick={() => send(text)}
            >
              {text}
              <ArrowUpRightIcon />
            </button>
          ))}
        </div>
        {history.isPending ? (
          <p role="status">Загружаем историю…</p>
        ) : history.isError ? (
          <ErrorState
            error={history.error}
            retry={() => {
              void history.refetch();
            }}
          />
        ) : (
          <div className={s.messages} aria-live="polite">
            {history.data.map((message) => (
              <div
                key={message.id}
                className={
                  message.author === "user" ? s.userMessage : s.aiMessage
                }
              >
                <strong>
                  {message.author === "user" ? "Вы" : "Вывод AI · демо"}
                </strong>
                <p>{message.text}</p>
                <div className={s.refs}>
                  {message.sourceIds.map((id) => {
                    const source = insight.sources.find(
                      (item) => item.id === id,
                    );
                    return (
                      source && (
                        <button
                          key={id}
                          onClick={() => open(source, message.text)}
                        >
                          {source.type === "company"
                            ? "Признак компании"
                            : source.type === "news"
                              ? "Источник события"
                              : "Материал банка"}
                        </button>
                      )
                    );
                  })}
                </div>
              </div>
            ))}
            {pending && (
              <div className={s.userMessage}>
                <strong>Вы</strong>
                <p>{pending.text}</p>
              </div>
            )}
            {ask.isPending && (
              <p role="status">
                <span className={s.typing}>•••</span> Готовим ответ…
              </p>
            )}
            {ask.isError && (
              <div className={s.chatError} role="alert">
                <p>{ask.error.message}</p>
                <button onClick={() => pending && ask.mutate(pending)}>
                  Повторить отправку
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <form
        className={s.chatForm}
        onSubmit={(event) => {
          event.preventDefault();
          send(question);
        }}
      >
        <label htmlFor="question">Ваш вопрос</label>
        <textarea
          id="question"
          placeholder="Задайте вопрос по разбору…"
          maxLength={1000}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div>
          <span>{question.length}/1000</span>
          <button
            className={s.primary}
            disabled={
              !question.trim() ||
              ask.isPending ||
              history.isPending ||
              history.isError
            }
            type="submit"
          >
            Отправить <Send size={15} />
          </button>
        </div>
        {mocksEnabled && (
          <label className={s.errorToggle}>
            <input
              type="checkbox"
              checked={simulateError}
              disabled={ask.isPending}
              onChange={(event) => setSimulateError(event.target.checked)}
            />
            Смоделировать ошибку ответа
          </label>
        )}
      </form>
      <p className={s.chatDisclaimer}>
        Синтетические ответы. История хранится до перезагрузки страницы отдельно
        для каждой компании, роли и события.
      </p>
    </aside>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={14} />;
}
