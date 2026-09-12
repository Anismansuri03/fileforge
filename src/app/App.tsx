import { Providers } from "./providers";
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/components/error-boundary";

export function App() {
  return (
    <Providers>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </Providers>
  );
}
