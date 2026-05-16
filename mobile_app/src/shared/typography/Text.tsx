import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Props = RNTextProps & {
  className?: string;
};

// TODO: typography tokens (sizes/weights) via NativeWind theme extension.

export function Text({ children, className, ...rest }: Props) {
  return (
    <RNText className={className} {...rest}>
      {children}
    </RNText>
  );
}
