import { http, HttpResponse, delay } from "msw";
import { AS_OF, companies, makeInsights } from "./data";
import type { Analysis, Message, Role } from "../types";
const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const route = (path: string) =>
  `${base.startsWith("http") ? base : `*${base}`}${path}`;
const errors = new Set<string>();
const jobs = new Map<
  string,
  { companyId: string; started: number; scenario: string }
>();
const histories = new Map<string, Message[]>();
const answered = new Map<string, Message[]>();
const feedbacks = new Map<string, boolean>();
const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });
const roleOf = (value: unknown): Role =>
  value === "ceo" || value === "treasurer" ? value : "cfo";
const companyOf = (id: unknown) => companies.find((c) => c.id === id);
const titles = [
  "Получение контекста",
  "Отбор событий",
  "Сопоставление с аналитикой банка",
  "Проверка источников",
  "Завершение",
];
function jobResult(id: string): Analysis | null {
  const job = jobs.get(id);
  if (!job) return null;
  const step = Math.min(5, Math.floor((Date.now() - job.started) / 1000));
  const failed = job.scenario === "failed" && step >= 3;
  const status = failed
    ? "failed"
    : step === 5
      ? job.scenario === "partial" || job.companyId === "services"
        ? "partial"
        : "completed"
      : step === 0
        ? "queued"
        : "running";
  return {
    id,
    companyId: job.companyId,
    status,
    stages: titles.map((title, index) => ({
      title,
      state: failed
        ? index < 2
          ? "done"
          : index === 2
            ? "failed"
            : "pending"
        : index < step
          ? "done"
          : index === step
            ? "active"
            : "pending",
    })),
    limitations:
      status === "partial"
        ? [
            "Часть клиентских данных отсутствует. Количественная оценка не выполнялась.",
          ]
        : failed
          ? [
              "Демонстрационная ошибка получения аналитики. Запустите анализ повторно.",
            ]
          : [
              "Этапы моделируют подготовку анализа. LLM и внешние источники не вызываются.",
            ],
  };
}
export const handlers = [
  http.get(route("/me"), async () => {
    await delay(180);
    return HttpResponse.json({
      name: "Александр М.",
      title: "Демонстрационный пользователь",
    });
  }),
  http.get(route("/companies"), async () => {
    await delay(180);
    return HttpResponse.json(companies);
  }),
  http.get(route("/companies/:id/profile"), async ({ params }) => {
    await delay(200);
    const company = companyOf(params.id);
    return company
      ? HttpResponse.json(company)
      : fail(403, "FORBIDDEN", "Нет доступа к выбранной компании.");
  }),
  http.get(route("/companies/:id/feed"), async ({ params, request }) => {
    await delay(350);
    const company = companyOf(params.id);
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");
    if (!company || scenario === "forbidden")
      return fail(403, "FORBIDDEN", "Нет доступа к аналитике этой компании.");
    const key = `feed-${company.id}`;
    if (scenario === "error" && !errors.has(key)) {
      errors.add(key);
      return fail(
        503,
        "UNAVAILABLE",
        "Источник временно недоступен. Повторите загрузку.",
      );
    }
    if (scenario !== "error") errors.delete(key);
    const all =
      scenario === "empty"
        ? []
        : makeInsights(company, roleOf(url.searchParams.get("role")));
    const period = url.searchParams.get("period") || "30";
    const impact = url.searchParams.get("impact") || "all";
    const search = (url.searchParams.get("search") || "")
      .trim()
      .toLocaleLowerCase("ru");
    const since =
      Date.parse(AS_OF.slice(0, 10)) - (Number(period) - 1) * 86400000;
    const items = all.filter(
      (item) =>
        Date.parse(item.date) >= since &&
        (impact === "all" || item.impact === impact) &&
        `${item.title} ${item.fact.text} ${item.why.text}`
          .toLocaleLowerCase("ru")
          .includes(search),
    );
    return HttpResponse.json({
      items,
      total: all.length,
      updatedAt: AS_OF,
      partial: scenario === "partial" || company.id === "services",
    });
  }),
  http.get(
    route("/companies/:id/insights/:insightId"),
    async ({ params, request }) => {
      await delay(250);
      const company = companyOf(params.id);
      const url = new URL(request.url);
      if (!company || url.searchParams.get("scenario") === "forbidden")
        return fail(403, "FORBIDDEN", "Нет доступа к этому разбору.");
      const insight = makeInsights(
        company,
        roleOf(url.searchParams.get("role")),
      ).find((i) => i.id === params.insightId);
      return insight
        ? HttpResponse.json(insight)
        : fail(404, "NOT_FOUND", "Инсайт не найден для выбранной компании.");
    },
  ),
  http.post(route("/companies/:id/analyses"), async ({ params, request }) => {
    await delay(250);
    if (!companyOf(params.id)) return fail(403, "FORBIDDEN", "Нет доступа.");
    const body = (await request.json()) as { scenario: string };
    const id = crypto.randomUUID();
    jobs.set(id, {
      companyId: String(params.id),
      scenario: body.scenario,
      started: Date.now(),
    });
    return HttpResponse.json(jobResult(id), { status: 202 });
  }),
  http.get(route("/analyses/:id"), async ({ params }) => {
    await delay(100);
    const job = jobResult(String(params.id));
    return job
      ? HttpResponse.json(job)
      : fail(404, "NOT_FOUND", "Задача анализа не найдена.");
  }),
  http.get(
    route("/companies/:id/insights/:insightId/messages"),
    async ({ params, request }) => {
      await delay(200);
      const company = companyOf(params.id);
      const role = roleOf(new URL(request.url).searchParams.get("role"));
      if (!company) return fail(403, "FORBIDDEN", "Нет доступа.");
      if (!makeInsights(company, role).some((i) => i.id === params.insightId))
        return fail(404, "NOT_FOUND", "Инсайт не найден.");
      return HttpResponse.json(
        histories.get(`${params.id}/${params.insightId}/${role}`) || [],
      );
    },
  ),
  http.post(
    route("/companies/:id/insights/:insightId/questions"),
    async ({ params, request }) => {
      await delay(900);
      const body = (await request.json()) as {
        question: string;
        role: Role;
        requestId: string;
        simulateError: boolean;
      };
      const company = companyOf(params.id);
      if (!company) return fail(403, "FORBIDDEN", "Нет доступа.");
      const insight = makeInsights(company, roleOf(body.role)).find(
        (i) => i.id === params.insightId,
      );
      if (!insight) return fail(404, "NOT_FOUND", "Инсайт не найден.");
      if (!body.question?.trim() || body.question.length > 1000)
        return fail(
          400,
          "INVALID_QUESTION",
          "Вопрос должен содержать от 1 до 1000 символов.",
        );
      const key = `${params.id}/${params.insightId}/${roleOf(body.role)}`;
      const requestKey = `${key}/${body.requestId}`;
      if (body.simulateError && !errors.has(requestKey)) {
        errors.add(requestKey);
        return fail(
          503,
          "QUESTION_FAILED",
          "Не удалось подготовить ответ. Вопрос сохранён для повтора.",
        );
      }
      if (answered.has(requestKey))
        return HttpResponse.json(answered.get(requestKey));
      const question = body.question.toLowerCase();
      let answer: string;
      let refs: string[];
      if (/данн|признак|контекст/.test(question)) {
        answer = `${company.name} · «${insight.title}». ${insight.why.text} Не хватает данных: ${company.missing.join(", ")}.`;
        refs = insight.why.sourceIds;
      } else if (/поток|ден|плат[её]ж|ликвид/.test(question)) {
        answer = `${company.name} · «${insight.title}». ${insight.effect.text} ${insight.risks[0].text} Без сумм и календаря платежей нельзя рассчитать денежный эффект.`;
        refs = insight.effect.sourceIds;
      } else if (/провер|решени|рассмотр/.test(question)) {
        answer = `${company.name} · «${insight.title}». ${insight.actions[0].text} ${insight.opportunities[0].text}`;
        refs = insight.actions[0].sourceIds;
      } else {
        answer = `В деморежиме я могу объяснить использованные данные, возможное влияние на денежный поток и проверки по событию «${insight.title}» для «${company.name}». Свободная генерация и поиск новых сведений не подключены. Попробуйте один из предложенных вопросов.`;
        refs = [];
      }
      const now = new Date().toISOString();
      const list = [
        ...(histories.get(key) || []),
        {
          id: `${body.requestId}-q`,
          author: "user" as const,
          text: body.question.trim(),
          sourceIds: [],
          createdAt: now,
        },
        {
          id: `${body.requestId}-a`,
          author: "assistant" as const,
          text: answer,
          sourceIds: refs,
          createdAt: now,
        },
      ];
      histories.set(key, list);
      answered.set(requestKey, list);
      return HttpResponse.json(list);
    },
  ),
  http.post(
    route("/companies/:id/insights/:insightId/feedback"),
    async ({ params, request }) => {
      await delay(200);
      const company = companyOf(params.id);
      if (!company) return fail(403, "FORBIDDEN", "Нет доступа.");
      if (!makeInsights(company, "cfo").some((i) => i.id === params.insightId))
        return fail(404, "NOT_FOUND", "Инсайт не найден.");
      const body = (await request.json()) as { useful: boolean };
      if (typeof body.useful !== "boolean")
        return fail(400, "INVALID_FEEDBACK", "Укажите оценку разбора.");
      feedbacks.set(`${params.id}/${params.insightId}`, body.useful);
      return HttpResponse.json({ saved: true });
    },
  ),
];
export function resetMockState() {
  histories.clear();
  answered.clear();
  errors.clear();
  jobs.clear();
  feedbacks.clear();
}
