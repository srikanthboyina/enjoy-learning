import { families } from '../../../theme';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

/** An analog clock: short red hour hand, long blue minute hand. */
export function Clock({ hour, minute, size = 150 }: { hour: number; minute: number; size?: number }) {
  const c = 50;
  const minAngle = (minute / 60) * 360;
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const hand = (angle: number, len: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x2: c + len * Math.cos(rad), y2: c + len * Math.sin(rad) };
  };
  const label = `${hour} ${minute === 0 ? "o'clock" : minute === 30 ? 'thirty' : minute}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={label}>
      <Circle cx={c} cy={c} r={47} fill="#FFF3BF" stroke="#FF922B" strokeWidth={5} />
      <Circle cx={c} cy={c} r={41} fill="#FFFFFF" />
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const rad = ((n * 30 - 90) * Math.PI) / 180;
        return (
          <SvgText
            key={n}
            x={c + 33 * Math.cos(rad)}
            y={c + 33 * Math.sin(rad) + 4}
            fontSize={11}
            fontWeight="bold"
            fontFamily={families.bold}
            fill="#2B2D42"
            textAnchor="middle">
            {n}
          </SvgText>
        );
      })}
      <G>
        <Line x1={c} y1={c} {...hand(hourAngle, 20)} stroke="#FA5252" strokeWidth={6} strokeLinecap="round" />
        <Line x1={c} y1={c} {...hand(minAngle, 30)} stroke="#339AF0" strokeWidth={4} strokeLinecap="round" />
      </G>
      <Circle cx={c} cy={c} r={4} fill="#2B2D42" />
    </Svg>
  );
}
