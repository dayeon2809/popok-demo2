import { EmptyState } from 'poc-app';

export function Default() {
  return <EmptyState />;
}

export function CustomMessage() {
  return <EmptyState message="검색 결과가 없습니다." />;
}
