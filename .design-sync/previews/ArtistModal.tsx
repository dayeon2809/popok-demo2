import { ArtistModal } from 'poc-app';
import type { ArtistWithWorks } from '@/types';

const artist: ArtistWithWorks = {
  id: 'demo-artist-1',
  name: '한서영',
  name_en: 'Han Seoyoung',
  works: ['봄의 제전', '경계 위에서'],
  field: 'contemporary_dance',
  type: 'individual',
  organization_or_affiliation: '무브먼트 스튜디오',
  year: 2024,
  bio: '몸의 언어로 사회적 경계를 탐구하는 안무가. 국내외 다수의 페스티벌에서 신작을 발표해왔다.',
  website: 'https://example.com',
  instagram: 'https://instagram.com/example',
  verified: true,
  aiSummary: '한서영은 현대무용을 기반으로 신체와 공간의 관계를 탐구하는 안무가로, 대표작 〈봄의 제전〉으로 주목받았다.',
  tags: ['현대무용', '안무가'],
};

export function Default() {
  return <ArtistModal artist={artist} onClose={() => {}} />;
}

export function Loading() {
  return <ArtistModal artist={null} loading onClose={() => {}} />;
}

export function Error() {
  return <ArtistModal artist={null} error="아티스트 정보를 불러오지 못했습니다." onClose={() => {}} />;
}
