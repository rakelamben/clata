import { forwardRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewInstance,
  type ViewStyle,
} from 'react-native';

import { colors, radii } from './theme';

type AppPressableProps = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  ringRadius?: number;
};

/**
 * A Pressable with a high-contrast focus ring for hardware keyboards, switch
 * access and web. The ring is drawn outside the control so it never changes the
 * layout, and it uses the focus token rather than a colour-only pressed state.
 */
export const AppPressable = forwardRef<ViewInstance, AppPressableProps>(function AppPressable(
  { children, containerStyle, ringRadius = radii.control, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <Pressable
        ref={ref}
        {...rest}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      >
        {children}
      </Pressable>
      {focused ? (
        <View
          pointerEvents="none"
          style={[styles.focusRing, { borderRadius: ringRadius + 4 }]}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  focusRing: {
    position: 'absolute',
    top: -4,
    right: -4,
    bottom: -4,
    left: -4,
    borderWidth: 2,
    borderColor: colors.focus,
  },
});
