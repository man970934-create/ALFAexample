import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "../App";
import { api, ApiError } from "../api";
import type { Filters } from "../types";
function mount(path: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const filters: Filters = {
  role: "cfo",
  period: "30",
  impact: "all",
  search: "",
  scenario: "normal",
};
describe("Основной пользовательский сценарий", () => {
  it("сбрасывает URL-фильтры и возвращает события", async () => {
    const user = userEvent.setup();
    mount(
      "/analytics?companyId=manufacturing&search=несуществующее&impact=opportunity&period=1",
    );
    await user.click(
      await screen.findByRole("button", { name: "Сбросить фильтры" }),
    );
    await screen.findByRole("heading", {
      name: "Стоимость финансирования остаётся высокой",
    });
    expect(
      screen.getByRole("textbox", { name: "Поиск по событиям" }),
    ).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Период" })).toHaveValue("30");
  });
  it("показывает серверные этапы и частичное завершение задачи", async () => {
    const user = userEvent.setup();
    mount("/analytics?companyId=services");
    await user.click(
      await screen.findByRole("button", { name: "Обновить анализ" }),
    );
    await screen.findByText("Получение контекста");
    await screen.findByText(
      "Анализ подготовлен частично",
      {},
      { timeout: 8000 },
    );
    expect(
      screen.getByRole("button", { name: "Обновить анализ" }),
    ).toBeEnabled();
    expect(screen.getAllByText("Готово")).toHaveLength(5);
  });
  it("с главной открывает аналитику, меняет компанию без старого контекста", async () => {
    const user = userEvent.setup();
    mount("/");
    await user.click(
      await screen.findByRole("link", { name: /Открыть аналитику/ }),
    );
    await screen.findByRole("heading", {
      name: "Стоимость финансирования остаётся высокой",
    });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Компания" }),
      "services",
    );
    await screen.findByRole("heading", {
      name: "Появились новые сроки размещения ликвидности",
    });
    expect(
      screen.queryByText(/У компании есть кредиты и лизинг/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/У компании есть депозиты, а кредиты отсутствуют/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Частичный результат", { selector: "strong" }),
    ).toBeInTheDocument();
  });
  it("открывает источник из утверждения и показывает связанный фрагмент", async () => {
    const user = userEvent.setup();
    mount("/analytics/insights/funding?companyId=manufacturing");
    const heading = await screen.findByRole("heading", {
      name: "Что произошло",
    });
    const section = heading.closest("section")!;
    await user.click(
      within(section).getByRole("button", { name: "Источник события" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Учебная новость · Стоимость денег"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Связанное утверждение" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Демонстрационный материал"),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Закрыть панель" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("повторяет ошибку вопроса и не смешивает истории компаний и событий", async () => {
    const user = userEvent.setup();
    mount("/analytics/insights/currency?companyId=trade");
    const suggestion = await screen.findByRole("button", {
      name: /Какие данные компании повлияли/,
    });
    await waitFor(() => expect(suggestion).toBeEnabled());
    await user.click(
      screen.getByRole("checkbox", { name: "Смоделировать ошибку ответа" }),
    );
    await user.click(suggestion);
    await user.click(
      await screen.findByRole(
        "button",
        { name: "Повторить отправку" },
        { timeout: 4000 },
      ),
    );
    await screen.findByText(
      /Меридиан Трейд · «Валютный рынок: колебания усилились»/,
      {},
      { timeout: 4000 },
    );
    const history = await api.messages("trade", "currency", "cfo");
    expect(history).toHaveLength(2);
    expect(history[1].text).toContain("Валюты контрактов");
    expect(history[1].sourceIds).toContain("news-currency");
    expect(await api.messages("manufacturing", "funding", "cfo")).toHaveLength(
      0,
    );
    expect(await api.messages("trade", "funding", "cfo")).toHaveLength(0);
    expect(await api.messages("trade", "currency", "ceo")).toHaveLength(0);
  });
  it("позволяет повторить неудачный запрос ленты", async () => {
    const user = userEvent.setup();
    mount("/analytics?companyId=manufacturing&scenario=error");
    await user.click(
      await screen.findByRole("button", { name: "Повторить запрос" }),
    );
    await screen.findByRole("heading", {
      name: "Стоимость финансирования остаётся высокой",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
describe("Контракт mock API", () => {
  it("фильтрует по периоду, влиянию и поиску, а роль меняет ранжирование", async () => {
    const cfo = await api.feed("manufacturing", filters);
    const ceo = await api.feed("manufacturing", { ...filters, role: "ceo" });
    expect(cfo.items[0].id).toBe("funding");
    expect(ceo.items[0].id).toBe("demand");
    expect(cfo.items[0].why.text).not.toBe(
      ceo.items.find((i) => i.id === "funding")?.why.text,
    );
    const filtered = await api.feed("manufacturing", {
      ...filters,
      impact: "risk",
      search: "металл",
      period: "7",
    });
    expect(filtered.items.map((i) => i.id)).toEqual(["metal"]);
    const today = await api.feed("manufacturing", { ...filters, period: "1" });
    expect(today.items.map((i) => i.id)).toEqual(["funding"]);
    const empty = await api.feed("manufacturing", {
      ...filters,
      search: "несуществующий запрос",
    });
    expect(empty.items).toHaveLength(0);
    expect(empty.total).toBeGreaterThan(0);
  });
  it("явно различает отсутствие доступа, неизвестный инсайт и отсутствие аналитики", async () => {
    await expect(
      api.insight("unknown", "funding", "cfo", "normal"),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      api.insight("services", "currency", "cfo", "normal"),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      api.insight("services", "currency", "cfo", "normal"),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (await api.insight("trade", "logistics", "cfo", "normal")).bank,
    ).toBeNull();
  });
  it("не выдаёт неизвестный продукт за отсутствующий и честно ограничивает свободные вопросы", async () => {
    const trade = await api.profile("trade");
    expect(trade.products.find((p) => p.name === "Кредит")?.status).toBe(
      "unknown",
    );
    const messages = await api.ask(
      "trade",
      "currency",
      "cfo",
      "Напиши стихотворение",
      "unknown-question",
      false,
    );
    expect(messages[1].text).toContain(
      "Свободная генерация и поиск новых сведений не подключены",
    );
    expect(messages[1].sourceIds).toHaveLength(0);
  });
});
