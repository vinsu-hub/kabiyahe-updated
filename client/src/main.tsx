import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/lib/supabase/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./styles/theme.css";
import "./index.css";
import "./elbiyahe.css";
import "./styles/shared-rails.css";
import "./admin.css";
import App from "./App";
import { listingRetry, listingRetryDelay } from "@/lib/supabase/queries";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: listingRetry, retryDelay: listingRetryDelay, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
