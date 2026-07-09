# POPOK Media Asset Management Guide

This guide explains where POPOK artist data, registration data, images, and videos live in the current codebase.

## Current Data Flow

### 1. Existing Showcase Artists

Existing artists shown in `/artists` are loaded from:

```text
data/artists.json
```

This file contains the current DANCE / MUSIC / VISUAL showcase data, including profile images, artist fields, selected works, career text, and motion profile metadata.

To edit an existing showcase artist, update that artist object in `data/artists.json`.

### 2. New POPOK Registrations

New registrations created from `/submit` are saved in Supabase:

```text
submissions table
```

The `/api/popok-submit` route inserts the required fields:

```text
name
genre
instagram
email
status
portfolio_works
```

`/p/[id]` reads the saved record back from the Supabase `submissions` table and renders the generated POPOK card.

### 3. How To Add A New Registration To Artists Showcase

Current behavior:

1. A user submits `/submit`.
2. The data is stored in Supabase `submissions` with `status: pending`.
3. Admin approval can create an artist record through the existing admin flow.
4. The public `/artists` showcase still uses `data/artists.json`, so showcase publication requires adding or syncing the approved artist into that file.

Do not add random new files or duplicate artist records. For now, keep `data/artists.json` as the source for public showcase artists.

## Profile Image

For existing showcase artists, profile images are referenced from `data/artists.json`:

```json
"profileImage": "/images/artists/artist-file.jpg"
```

The image file should live in:

```text
public/images/artists/
```

For new `/submit` registrations, optional profile images are uploaded to Supabase Storage:

```text
bucket: artist-media
path: submissions/[generated-name]/profile/[file]
```

The resulting public URL is stored in `submissions.portfolio_works` as:

```json
{
  "kind": "popok_registration_media",
  "profile_image_url": "https://...",
  "motion_video_url": null
}
```

## Motion Profile Video

For existing showcase artists, motion profile metadata is edited in `data/artists.json`:

```json
"motionProfile": {
  "type": "video",
  "src": "/media/motion/[artist-id]/motion.mp4",
  "poster": "/media/motion/[artist-id]/cover.jpg",
  "title": "Motion Profile",
  "caption": "15 sec artist intro"
}
```

Local motion files should live in:

```text
public/media/motion/[artist-id]/
```

For new `/submit` registrations, optional Motion Profile videos are stored as YouTube or Vimeo links only. Users do not upload video files from `/submit`.

```text
YouTube: https://www.youtube.com/watch?v=...
YouTube short link: https://youtu.be/...
YouTube Shorts: https://www.youtube.com/shorts/...
Vimeo: https://vimeo.com/123456789
```

The original URL is stored in `submissions.portfolio_works` under `motion_video_url`.

```json
{
  "kind": "popok_registration_media",
  "profile_image_url": "https://...",
  "motion_video_url": "https://www.youtube.com/watch?v=MXjZ34I_mCk",
  "motion_video_provider": "youtube"
}
```

## Selected Works

Selected works for existing showcase artists are edited in `data/artists.json`, usually in `portfolio_works`.

Example:

```json
"portfolio_works": [
  {
    "title": "Work Title",
    "year": "2026",
    "description": "Work description",
    "role": "Choreographer",
    "image_url": "/media/works/work-id/cover.jpg",
    "media": {
      "type": "youtube",
      "url": "https://www.youtube.com/watch?v=..."
    }
  }
]
```

## Work Images

Work images should live in:

```text
public/media/works/[work-id]/
```

Then reference them from the matching work object:

```json
"image_url": "/media/works/[work-id]/cover.jpg"
```

## Work Videos

The bottom sheet media player supports YouTube, Vimeo, direct MP4, and image media. Add video data to the relevant work object in `data/artists.json`.

### YouTube

```json
"media": {
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Vimeo

```json
"media": {
  "type": "vimeo",
  "url": "https://vimeo.com/84938491"
}
```

### Direct MP4

Store the MP4 file in:

```text
public/media/works/[work-id]/
```

Then reference it:

```json
"media": {
  "type": "video",
  "src": "/media/works/[work-id]/video.mp4",
  "poster": "/media/works/[work-id]/cover.jpg"
}
```

### Image Only

```json
"media": {
  "type": "image",
  "src": "/media/works/[work-id]/cover.jpg"
}
```

## Quick Reference

| CONTENT TYPE | WHERE TO STORE | WHERE TO EDIT |
| --- | --- | --- |
| Existing Artist Info | `data/artists.json` | Edit the matching artist object in `data/artists.json` |
| New POPOK Registration | Supabase `submissions` table | Use `/submit`; review in admin submissions |
| Registration Profile Image | Supabase Storage `artist-media` bucket | Uploaded from `/submit`; public URL stored in `submissions.portfolio_works` |
| Registration Motion Profile | YouTube or Vimeo original URL | Enter from `/submit`; URL stored in `submissions.portfolio_works.motion_video_url` |
| Existing Artist Motion Profile | `public/media/motion/[artist-id]/` | Edit `data/artists.json` `motionProfile` |
| Work Info | `data/artists.json` | Edit `portfolio_works` or selected work fields |
| Work Image | `public/media/works/[work-id]/` | Reference with `image_url` or `media.src` |
| YouTube Work Video | YouTube URL | Add to `data/artists.json` work `media.url` with `type: "youtube"` |
| Vimeo Work Video | Vimeo URL | Add to `data/artists.json` work `media.url` with `type: "vimeo"` |
| Direct MP4 Work Video | `public/media/works/[work-id]/` | Add to `data/artists.json` work `media.src` with `type: "video"` |
