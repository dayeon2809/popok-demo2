import { LoadingSpinner } from 'poc-app';

export function Default() {
  return <LoadingSpinner />;
}

export function CustomMessage() {
  return <LoadingSpinner message="아티스트 정보를 불러오는 중..." />;
}
