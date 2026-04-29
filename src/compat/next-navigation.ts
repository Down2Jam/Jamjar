import {
  useLocation,
  useNavigate,
  useParams as useReactRouterParams,
} from "react-router";
import { useMemo } from "react";

type NextNavigateOptions = {
  replace?: boolean;
  scroll?: boolean;
  state?: unknown;
};

export function useRouter() {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      push: (href: string, options?: NextNavigateOptions) =>
        navigate(href, options),
      replace: (href: string, options?: NextNavigateOptions) =>
        navigate(href, { ...options, replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => window.location.reload(),
      prefetch: (_href: string) => undefined,
    }),
    [navigate],
  );
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export const useParams = useReactRouterParams;

export function redirect(href: string) {
  window.location.assign(href);
}
