import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '../../../ui/theme';

export function ConversationSetupIllustration({ width = 192, height = 132 }: { width?: number; height?: number }) {
  return (
    <Svg viewBox="0 0 320 220" width={width} height={height} accessible={false}>
      <G transform="rotate(-8 126 91)">
        <Path
          fill={colors.surface}
          stroke={colors.border}
          strokeWidth={1.5}
          d="M58 30h143a14 14 0 0 1 14 14v75a14 14 0 0 1-14 14h-89l-30 23v-23H58a14 14 0 0 1-14-14V44a14 14 0 0 1 14-14Z"
        />
        <Rect fill={colors.border} x="67" y="56" width="105" height="6" rx="3" />
        <Rect fill={colors.border} x="67" y="75" width="73" height="6" rx="3" />
      </G>
      <G transform="rotate(7 201 144)">
        <Path
          fill={colors.navy}
          d="M128 89h136a14 14 0 0 1 14 14v65a14 14 0 0 1-14 14h-12v24l-31-24h-93a14 14 0 0 1-14-14v-65a14 14 0 0 1 14-14Z"
        />
        <Path stroke={colors.surface} strokeWidth={3} strokeLinecap="round" d="M138 117h113m-113 20h80" />
        <Rect fill={colors.primary} x="138" y="151" width="49" height="9" rx="4" />
      </G>
    </Svg>
  );
}

export function GuessSetupIllustration({ width = 280, height = 220 }: { width?: number; height?: number }) {
  return (
    <Svg viewBox="0 0 320 260" width={width} height={height} accessible={false}>
      <G transform="rotate(-12 126 122)">
        <Rect fill={colors.surface} stroke={colors.border} strokeWidth={1.5} x="52" y="24" width="160" height="196" rx="14" />
        <Rect fill={colors.border} x="72" y="48" width="76" height="6" rx="3" />
        <Rect fill={colors.border} x="72" y="63" width="112" height="6" rx="3" />
      </G>
      <G transform="rotate(8 176 136)">
        <Rect fill={colors.navy} x="92" y="42" width="160" height="196" rx="14" />
        <Path
          fill="none"
          stroke={colors.surface}
          strokeWidth={5}
          strokeLinecap="round"
          d="M158 86c0-9 7-15 16-15s16 6 16 14c0 13-16 12-16 24m0 13v1"
        />
        <Rect fill="none" stroke={colors.surface} strokeWidth={1} x="111" y="145" width="122" height="23" rx="6" />
        <Rect fill={colors.primary} x="111" y="178" width="122" height="23" rx="6" />
        <Path stroke={colors.surface} strokeWidth={3} strokeLinecap="round" d="M124 157h61" />
        <Path stroke={colors.surface} strokeWidth={3} strokeLinecap="round" d="M124 190h61" />
        <Path fill="none" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m207 189 4 4 7-8" />
      </G>
      <G transform="rotate(-12 253 193)">
        <Circle fill={colors.surface} stroke={colors.primary} strokeWidth={6} cx="252" cy="181" r="26" />
        <Path stroke={colors.primary} strokeWidth={10} strokeLinecap="round" d="m271 201 22 22" />
        <Path fill="none" stroke={colors.navy} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" d="m242 181 7 7 13-14" />
      </G>
    </Svg>
  );
}

export function GapSetupIllustration({ width = 280, height = 220 }: { width?: number; height?: number }) {
  return (
    <Svg viewBox="0 0 320 260" width={width} height={height} accessible={false}>
      <G transform="rotate(-12 126 122)">
        <Rect fill={colors.surface} stroke={colors.border} strokeWidth={1.5} x="52" y="24" width="160" height="196" rx="14" />
        <Rect fill={colors.border} x="72" y="48" width="76" height="6" rx="3" />
        <Rect fill={colors.border} x="72" y="63" width="112" height="6" rx="3" />
      </G>
      <G transform="rotate(8 176 136)">
        <Rect fill={colors.navy} x="92" y="42" width="160" height="196" rx="14" />
        <G>
          <Path stroke={colors.surface} strokeWidth={3} strokeLinecap="round" d="M113 86h35m-35 28h89" />
          <Rect fill="none" stroke={colors.primary} strokeWidth={2} strokeDasharray="5 4" x="160" y="73" width="62" height="26" rx="5" />
        </G>
        <Rect fill="none" stroke={colors.surface} strokeWidth={1} x="111" y="145" width="122" height="23" rx="6" />
        <Rect fill={colors.primary} x="111" y="178" width="122" height="23" rx="6" />
        <Path stroke={colors.surface} strokeWidth={3} strokeLinecap="round" d="M124 157h61" />
        <Path stroke={colors.surface} strokeWidth={3} strokeLinecap="round" d="M124 190h61" />
        <Path fill="none" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m207 189 4 4 7-8" />
      </G>
      <G transform="rotate(-12 254 199)">
        <Rect fill={colors.primary} x="222" y="183" width="66" height="34" rx="8" />
        <Path fill="none" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m244 200 7 7 14-16" />
      </G>
    </Svg>
  );
}

export function PracticeSummaryIllustration({ width = 280, height = 190 }: { width?: number; height?: number }) {
  return (
    <Svg viewBox="0 0 320 220" width={width} height={height} accessible={false}>
      <Circle fill="rgba(22, 104, 104, 0.09)" cx="160" cy="112" r="86" />
      <Path fill="none" stroke={colors.teal} strokeWidth={5} strokeLinecap="round" d="m63 55 9 9m-1-19 3-12m177 25 10-8m-3 21 13 2" />
      <Path fill="none" stroke={colors.primary} strokeWidth={5} strokeLinecap="round" d="m99 31-4-13m128 24 5-12M49 109l-13 3m246 5 12 5" />
      <G transform="rotate(-7 143 119)">
        <Rect fill={colors.surface} stroke={colors.border} strokeWidth={2} x="82" y="52" width="132" height="142" rx="16" />
        <Rect fill={colors.border} x="103" y="76" width="72" height="7" rx="3.5" />
        <Rect fill={colors.border} x="103" y="94" width="90" height="7" rx="3.5" />
        <Rect fill={colors.navy} x="103" y="124" width="90" height="42" rx="9" />
      </G>
      <G>
        <Circle fill={colors.primary} stroke={colors.background} strokeWidth={7} cx="225" cy="151" r="34" />
        <Path fill="none" stroke={colors.surface} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" d="m212 151 10 10 18-20" />
      </G>
    </Svg>
  );
}
