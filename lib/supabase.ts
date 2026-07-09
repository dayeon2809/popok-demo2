import { UserProfile, PerformanceComment, PerformanceRating, ArtistComment } from "@/types";

// ── Mock Database & Authentication system (localStorage based) ──
const PROFILE_KEY = "poc_user_profile";
const COMMENTS_KEY = "poc_comments";
const ARTIST_COMMENTS_KEY = "poc_artist_comments";
const RATINGS_KEY = "poc_ratings";

export function getLoggedInUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function mockLogin(email: string, nickname: string): UserProfile {
  const user = getLoggedInUser();
  const savedPerformances = user?.savedPerformances || [];
  const savedArtists = user?.savedArtists || [];
  
  const newUser: UserProfile = {
    id: `mock-user-${Date.now()}`,
    email: email.trim(),
    nickname: nickname.trim(),
    avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(nickname.trim())}`,
    createdAt: new Date().toISOString(),
    savedPerformances,
    savedArtists
  };
  
  localStorage.setItem(PROFILE_KEY, JSON.stringify(newUser));
  return newUser;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PROFILE_KEY);
  }
}

export function updateProfile(nickname: string, avatarUrl: string): UserProfile | null {
  const user = getLoggedInUser();
  if (!user) return null;
  user.nickname = nickname.trim();
  user.avatarUrl = avatarUrl.trim();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
  return user;
}

// ── Comments ──
export function getComments(performanceId: string): PerformanceComment[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(COMMENTS_KEY);
  if (!raw) return [];
  try {
    const allComments: any[] = JSON.parse(raw);
    return allComments.filter(c => c.performanceId === performanceId);
  } catch (e) {
    return [];
  }
}

export function addComment(performanceId: string, content: string): PerformanceComment | null {
  const user = getLoggedInUser();
  if (!user) return null;
  
  const newComment: PerformanceComment & { likesCount?: number; likesUsers?: string[] } = {
    id: `comment-${Date.now()}`,
    performanceId,
    userId: user.id,
    userName: user.nickname,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likesCount: 0,
    likesUsers: []
  };
  
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(COMMENTS_KEY);
    let all: any[] = [];
    if (raw) {
      try { all = JSON.parse(raw); } catch (e) {}
    }
    all.push(newComment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  }
  return newComment;
}

export function deleteComment(commentId: string): boolean {
  const user = getLoggedInUser();
  if (!user) return false;
  
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) return false;
    try {
      let all: any[] = JSON.parse(raw);
      const comment = all.find(c => c.id === commentId);
      if (!comment || comment.userId !== user.id) return false;
      
      all = all.filter(c => c.id !== commentId);
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export function toggleLikeComment(commentId: string): { likesCount: number; hasLiked: boolean } | null {
  const user = getLoggedInUser();
  if (!user) return null;
  
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) return null;
    try {
      const all: any[] = JSON.parse(raw);
      const comment = all.find(c => c.id === commentId);
      if (!comment) return null;
      
      if (!comment.likesUsers) comment.likesUsers = [];
      const index = comment.likesUsers.indexOf(user.id);
      let hasLiked = false;
      if (index === -1) {
        comment.likesUsers.push(user.id);
        hasLiked = true;
      } else {
        comment.likesUsers.splice(index, 1);
        hasLiked = false;
      }
      comment.likesCount = comment.likesUsers.length;
      
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
      return { likesCount: comment.likesCount, hasLiked };
    } catch (e) {
      return null;
    }
  }
  return null;
}

// ── Ratings ──
export function getRatings(performanceId: string): PerformanceRating[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RATINGS_KEY);
  if (!raw) return [];
  try {
    const all: PerformanceRating[] = JSON.parse(raw);
    return all.filter(r => r.performanceId === performanceId);
  } catch (e) {
    return [];
  }
}

export function addRating(performanceId: string, rating: number): PerformanceRating | null {
  const user = getLoggedInUser();
  if (!user) return null;
  
  const newRating: PerformanceRating = {
    id: `rating-${performanceId}-${user.id}`,
    performanceId,
    userId: user.id,
    rating,
    createdAt: new Date().toISOString()
  };
  
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(RATINGS_KEY);
    let all: PerformanceRating[] = [];
    if (raw) {
      try { all = JSON.parse(raw); } catch (e) {}
    }
    // Remove previous rating by this user if exists
    all = all.filter(r => !(r.performanceId === performanceId && r.userId === user.id));
    all.push(newRating);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
  }
  return newRating;
}

export function getAverageRating(performanceId: string): { average: number; count: number } {
  const ratings = getRatings(performanceId);
  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length
  };
}

// ── Saves (Saved Performances) ──
export function toggleSavePerformance(performanceId: string): boolean {
  const user = getLoggedInUser();
  if (!user) return false;
  
  if (!user.savedPerformances) user.savedPerformances = [];
  const index = user.savedPerformances.indexOf(performanceId);
  let saved = false;
  if (index === -1) {
    user.savedPerformances.push(performanceId);
    saved = true;
  } else {
    user.savedPerformances.splice(index, 1);
    saved = false;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
  return saved;
}

export function isPerformanceSaved(performanceId: string): boolean {
  const user = getLoggedInUser();
  if (!user) return false;
  return !!user.savedPerformances?.includes(performanceId);
}

// ── Profile Queries ──
export function getUserComments(): PerformanceComment[] {
  const user = getLoggedInUser();
  if (!user || typeof window === "undefined") return [];
  const raw = localStorage.getItem(COMMENTS_KEY);
  if (!raw) return [];
  try {
    const all: PerformanceComment[] = JSON.parse(raw);
    return all.filter(c => c.userId === user.id);
  } catch (e) {
    return [];
  }
}

export function getUserRatings(): PerformanceRating[] {
  const user = getLoggedInUser();
  if (!user || typeof window === "undefined") return [];
  const raw = localStorage.getItem(RATINGS_KEY);
  if (!raw) return [];
  try {
    const all: PerformanceRating[] = JSON.parse(raw);
    return all.filter(r => r.userId === user.id);
  } catch (e) {
    return [];
  }
}

// ── Artist Comments ──
export function getArtistComments(artistId: string): ArtistComment[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ARTIST_COMMENTS_KEY);
  if (!raw) return [];
  try {
    const allComments: any[] = JSON.parse(raw);
    return allComments.filter(c => c.artistId === artistId);
  } catch (e) {
    return [];
  }
}

export function addArtistComment(artistId: string, content: string): ArtistComment | null {
  const user = getLoggedInUser();
  if (!user) return null;
  
  const newComment: ArtistComment & { likesCount?: number; likesUsers?: string[] } = {
    id: `artist-comment-${Date.now()}`,
    artistId,
    userId: user.id,
    userName: user.nickname,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likesCount: 0,
    likesUsers: []
  };
  
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(ARTIST_COMMENTS_KEY);
    let all: any[] = [];
    if (raw) {
      try { all = JSON.parse(raw); } catch (e) {}
    }
    all.push(newComment);
    localStorage.setItem(ARTIST_COMMENTS_KEY, JSON.stringify(all));
  }
  return newComment;
}

export function deleteArtistComment(commentId: string): boolean {
  const user = getLoggedInUser();
  if (!user) return false;
  
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(ARTIST_COMMENTS_KEY);
    if (!raw) return false;
    try {
      let all: any[] = JSON.parse(raw);
      const comment = all.find(c => c.id === commentId);
      if (!comment || comment.userId !== user.id) return false;
      
      all = all.filter(c => c.id !== commentId);
      localStorage.setItem(ARTIST_COMMENTS_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export function toggleLikeArtistComment(commentId: string): { likesCount: number; hasLiked: boolean } | null {
  const user = getLoggedInUser();
  if (!user) return null;
  
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(ARTIST_COMMENTS_KEY);
    if (!raw) return null;
    try {
      const all: any[] = JSON.parse(raw);
      const comment = all.find(c => c.id === commentId);
      if (!comment) return null;
      
      if (!comment.likesUsers) comment.likesUsers = [];
      const index = comment.likesUsers.indexOf(user.id);
      let hasLiked = false;
      if (index === -1) {
        comment.likesUsers.push(user.id);
        hasLiked = true;
      } else {
        comment.likesUsers.splice(index, 1);
        hasLiked = false;
      }
      comment.likesCount = comment.likesUsers.length;
      
      localStorage.setItem(ARTIST_COMMENTS_KEY, JSON.stringify(all));
      return { likesCount: comment.likesCount, hasLiked };
    } catch (e) {
      return null;
    }
  }
  return null;
}

// ── Saves (Saved Artists) ──
export function toggleSaveArtist(artistId: string): boolean {
  const user = getLoggedInUser();
  if (!user) return false;
  
  if (!user.savedArtists) user.savedArtists = [];
  const index = user.savedArtists.indexOf(artistId);
  let saved = false;
  if (index === -1) {
    user.savedArtists.push(artistId);
    saved = true;
  } else {
    user.savedArtists.splice(index, 1);
    saved = false;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
  return saved;
}

export function isArtistSaved(artistId: string): boolean {
  const user = getLoggedInUser();
  if (!user) return false;
  return !!user.savedArtists?.includes(artistId);
}

// ── Profile Queries for Artists ──
export function getUserArtistComments(): ArtistComment[] {
  const user = getLoggedInUser();
  if (!user || typeof window === "undefined") return [];
  const raw = localStorage.getItem(ARTIST_COMMENTS_KEY);
  if (!raw) return [];
  try {
    const all: ArtistComment[] = JSON.parse(raw);
    return all.filter(c => c.userId === user.id);
  } catch (e) {
    return [];
  }
}

// ── Supabase Integration Placeholders (Future Setup) ──
// For real deployment, initialize Supabase as follows:
// import { createClient } from "@supabase/supabase-js";
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// export const supabase = createClient(supabaseUrl, supabaseKey);
