type TextColor =
  | "text"
  | "textFaded"
  | "textLight"
  | "textLightFaded"
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "orange";
export type TextSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl";
export type TextWeight =
  | "thin"
  | "extralight"
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold"
  | "black";
export type TextAlign = "left" | "center" | "right" | "justify";
export type TextTransform = "uppercase" | "lowercase" | "capitalize";
export type GradientSpec = {
  from: string;
  to: string;
  direction?: string;
};

export interface TextBaseProps {
  size?: TextSize;
  color?: TextColor;
  align?: TextAlign;
  weight?: TextWeight;
  transform?: TextTransform;
  gradient?: GradientSpec;
  as?: keyof JSX.IntrinsicElements;
}

type AsProp<E extends React.ElementType> = {
  as?: E;
};

type PropsTo<E extends React.ElementType, P> = Omit<
  React.ComponentPropsWithoutRef<E>,
  keyof P
> &
  P &
  AsProp<E>;

type PolymorphicRef<E extends React.ElementType> =
  React.ComponentPropsWithRef<E>["ref"];

export type TextProps<E extends React.ElementType = "p"> = PropsTo<
  E,
  TextBaseProps
> & {
  ref?: PolymorphicRef<E>;
};
