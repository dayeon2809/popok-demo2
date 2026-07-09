import { CountUp } from 'poc-app';

export function Default() {
  return <CountUp end={1284} />;
}

export function WithSuffix() {
  return <CountUp end={98} suffix="%" />;
}

export function LargeNumber() {
  return <CountUp end={128400} suffix="+" duration={2400} />;
}
