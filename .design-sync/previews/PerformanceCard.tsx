import { PerformanceCard } from 'poc-app';
import type { Performance } from '@/types';

const performance: Performance = {
  id: 'demo-performance-1',
  title: '경계 위에서',
  company: '무브먼트 컴퍼니',
  venue: '대학로 예술극장',
  city: '서울',
  startDate: '2026-09-12',
  endDate: '2026-09-14',
  posterImage: '',
  genre: ['현대무용', '컨템포러리'],
  ticketUrl: 'https://example.com/ticket',
  artistIds: ['demo-artist-1'],
  status: 'published',
  description: '몸과 공간의 경계를 탐구하는 신작 공연.',
};

export function Default() {
  return <PerformanceCard performance={performance} onClick={() => {}} />;
}
