"use client";

import NextLink from "next/link";
import {
  useRouter as useNextRouter,
  usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import React, { useEffect } from "react";

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to?: string;
  href?: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, href, children, prefetch = true, ...props }, ref) => {
    const target = href || to || "/";
    return (
      <NextLink ref={ref} href={target} prefetch={prefetch} {...(props as any)}>
        {children}
      </NextLink>
    );
  }
);
Link.displayName = "Link";

export const useNavigate = () => {
  const router = useNextRouter();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (to === -1) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
};

export const useLocation = () => {
  const pathname = usePathname();
  let search = "";
  if (typeof window !== "undefined") {
    search = window.location.search || "";
  }
  return {
    pathname: pathname || "/",
    search,
    hash: "",
    state: null,
    key: "default",
  };
};

export const useParams = <
  T extends Record<string, string | string[] | undefined> = Record<string, string>,
>(): T => {
  const params = useNextParams();
  return (params || {}) as T;
};

export const useSearchParams = () => {
  const searchParams = useNextSearchParams();
  const router = useNextRouter();
  const pathname = usePathname();

  const safeSearchParams: URLSearchParams =
    (searchParams as unknown as URLSearchParams) || new URLSearchParams();

  const setSearchParams = (nextInit: Record<string, string> | URLSearchParams) => {
    const params = new URLSearchParams(nextInit as any);
    router.push(`${pathname}?${params.toString()}`);
  };

  return [safeSearchParams, setSearchParams] as const;
};

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({
  to,
  replace,
}) => {
  const router = useNextRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router, to, replace]);
  return null;
};

export const Outlet: React.FC<{ context?: any; children?: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

export default Link;
