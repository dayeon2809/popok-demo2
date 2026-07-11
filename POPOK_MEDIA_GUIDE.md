# POPOK Media Asset Management Guide

This guide explains where POPOK artist data, registration data, images, and videos live in the codebase and defines directory structures and reference mapping rules.

---

## 1. Directory Structure Standards

To ensure scalability and keep assets organized, all local media assets live under `public/media/` grouped by artist ID and work slugs.

### Artist Basic Media
Artist-specific profile and motion assets:
```text
public/media/artists/[artist-id]/
├── profile.[ext]       (Profile image, e.g. profile.jpg, profile.png, profile.webp)
└── motion.[ext]        (Motion profile video/file, preserving original extension e.g. motion.mp4, motion.mov)
```
- **profile.[ext]**: Standard name for the main profile image. The original extension (`.jpg`, `.png`, `.webp`, etc.) is preserved.
- **motion.[ext]**: Standard name for local motion profile files. The original extension (`.mp4`, `.mov`, etc.) is preserved.

### Works Portfolio Assets
Representative images and documents for individual works:
```text
public/media/works/[artist-id]/[work-slug]/
├── image.[ext]         (Representative image/poster/thumbnail, e.g. image.jpg, image.gif)
├── video.mp4           (Direct MP4 work video - optional/future)
└── program.pdf         (Program book - optional/future)
```
- **image.[ext]**: Representative work image. Do not name it `poster.jpg` since works may represent exhibitions, videos, or archives that are not posters. The original extension (`.jpg`, `.png`, `.gif`, etc.) is preserved.
- **work-slug**: A URL-friendly, lowercase, hyphen-separated string unique to each work under the artist (e.g., `body-concert`).

---

## 2. Standard Works Data Model

The JSON works field is standardized from `portfolio_works` to `works` inside `data/artists.json` (and matching TypeScript types):

```json
{
  "id": "kim-boram",
  "name": "김보람",
  "profileImage": "/media/artists/kim-boram/profile.jpg",
  "works": [
    {
      "id": "kim-boram-001",
      "slug": "body-concert",
      "title": "바디콘서트",
      "year": "2026",
      "description": "엠비규어스 대표작",
      "role": "안무",
      "image_url": "/media/works/kim-boram/body-concert/image.gif",
      "media": {
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=..."
      },
      "created_at": "2026-07-11T03:00:00.000Z",
      "updated_at": "2026-07-11T03:00:00.000Z"
    }
  ]
}
```

### Allowed `media.type` Values
The bottom sheet media player and components support the following values for `media.type`:
- **`youtube`**: YouTube video link (renders YouTube player).
- **`vimeo`**: Vimeo video link (renders Vimeo player).
- **`instagram`**: Instagram post link (renders post preview/link).
- **`video`**: Direct video file path or URL (renders custom `<video>` player).
- **`url`**: Generic external website or archive page (renders link or iframe).
- **`pdf`**: Program book or portfolio PDF file (renders view/download link).

### ID and Slug Rules
1. **Stable ID (`id`)**: A unique data identifier prefixed with the artist ID (e.g. `kim-boram-001`, `kim-boram-002`). This ID is permanent and **must never change** even if the work title or slug changes in the future.
2. **Slug (`slug`)**: A lowercase alphanumeric + hyphen string used in directory names and URL pathways (e.g., `body-concert`). Slugs must be unique per artist.

---

## 3. Path Versatility & Support

The codebase supports three different path structures dynamically. Output components directly render these values without hardcoded prefixes:

1. **Local public paths**: `/media/artists/kim-boram/profile.jpg`
2. **Supabase Storage URLs**: `https://xxxx.supabase.co/storage/v1/object/public/media/artists/kim-boram/profile.jpg`
3. **Crawled external URLs**: `https://external-site.com/images/poster.jpg`

---

## 4. Smart Merge Sync Safeguard

During Supabase database synchronization (`lib/syncArtists.ts`):
- Local edits (work `id`, `slug`, `image_url`, `profileImage`, `motion_url`) are protected.
- Synced DB records are merged with local records using matching order priority:
  1. Stable ID (`id`) matching
  2. URL Slug (`slug`) matching
  3. Title + Year combo matching
  4. Title only matching
- DB inputs from Airtable/legacy tables are parsed from `record.works ?? record.portfolio_works ?? []` and saved to file under the standardized `works` key.
- Updates and inserts to the database only save the standard `works` key, leaving the legacy `portfolio_works` field untouched.
