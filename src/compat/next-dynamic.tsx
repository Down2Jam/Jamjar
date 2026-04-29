import {
  lazy,
  Suspense,
  type ComponentType,
  type ReactNode,
} from "react";

type DynamicOptions = {
  loading?: () => ReactNode;
  ssr?: boolean;
};

export default function dynamic<TProps extends object>(
  loader: () =>
    | Promise<{ default: ComponentType<TProps> }>
    | Promise<ComponentType<TProps>>,
  options?: DynamicOptions,
) {
  const LazyComponent = lazy(async () => {
    const loaded = await loader();
    return "default" in loaded
      ? loaded
      : { default: loaded as ComponentType<TProps> };
  });

  return function DynamicComponent(props: TProps) {
    return (
      <Suspense fallback={options?.loading?.() ?? null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
