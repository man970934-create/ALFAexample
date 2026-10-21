import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { mocksEnabled } from "./api";
import "./tokens.css";
async function start() {
  if (mocksEnabled) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledFrame: "bypass", quiet: true });
  }
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30000, refetchOnWindowFocus: false },
    },
  });
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
start().catch(() => {
  document.getElementById("root")!.textContent =
    "Не удалось запустить приложение. Проверьте доступность mockServiceWorker.js и перезагрузите страницу.";
});
