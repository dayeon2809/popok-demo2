import { ArtistCard } from 'poc-app';
import type { Artist } from '@/types';

const withPhoto: Artist = {
  id: 'demo-artist-1',
  name: '한서영',
  name_en: 'Han Seoyoung',
  works: ['봄의 제전', '경계 위에서'],
  field: 'contemporary_dance',
  type: 'individual',
  profileImage: undefined,
  instagram: 'https://instagram.com/example',
  website: 'https://example.com',
  verified: true,
};

const noPhoto: Artist = {
  id: 'demo-artist-2',
  name: '무브먼트 컴퍼니',
  name_en: 'Movement Company',
  works: ['도시의 리듬'],
  field: 'interdisciplinary',
  type: 'company',
  verified: false,
};

export function Default() {
  return <ArtistCard artist={withPhoto} onClick={() => {}} />;
}

export function NoImage() {
  return <ArtistCard artist={noPhoto} onClick={() => {}} />;
}
