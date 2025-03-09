import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import Products from "@/pages/admin/products";
import Categories from "@/pages/admin/categories";
import Orders from "@/pages/admin/orders";
import Support from "@/pages/admin/support";

function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return (
    <ProtectedRoute
      path={path}
      component={() => {
        // Проверка на админа происходит на бэкенде
        return <Component />;
      }}
    />
  );
}

function Router() {
  return (
    <Switch>
      {/* По умолчанию редиректим на /admin/products */}
      <Route path="/">
        <AdminRoute path="/" component={Products} />
      </Route>
      <Route path="/auth" component={AuthPage} />
      <AdminRoute path="/admin/products" component={Products} />
      <AdminRoute path="/admin/categories" component={Categories} />
      <AdminRoute path="/admin/orders" component={Orders} />
      <AdminRoute path="/admin/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;