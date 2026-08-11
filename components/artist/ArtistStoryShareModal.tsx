"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analytics } from "@/lib/analytics";

export interface ArtistStoryCardData {
  id: string;
  slug: string;
  name: string;
  nameEn?: string | null;
  genre?: string | null;
  role?: string | null;
  instagram?: string | null;
  profileImage?: string | null;
  profileUrl: string;
}

interface Props { open: boolean; onClose: () => void; artist: ArtistStoryCardData; onToast?: (message: string) => void; }

const WIDTH = 1080;
const HEIGHT = 1920;
const CARD_X = 135;
const CARD_Y = 330;
const CARD_W = 810;
const CARD_H = 1190;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.closePath();
}
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, min: number, weight = 900) {
  let size = start;
  while (size > min) { ctx.font = `${weight} ${size}px Arial, sans-serif`; if (ctx.measureText(text).width <= maxWidth) break; size -= 2; }
  return size;
}
function instagramHandle(value?: string | null) {
  if (!value) return "@username";
  const clean = value.trim().replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/\/.*$/, "");
  return clean ? `@${clean}` : "@username";
}
async function loadProfileBitmap(src?: string | null): Promise<ImageBitmap | null> {
  if (!src) return null;
  try { const response = await fetch(src, { mode: "cors" }); if (!response.ok) return null; return await createImageBitmap(await response.blob()); } catch { return null; }
}
function drawCover(ctx: CanvasRenderingContext2D, image: ImageBitmap, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height); const sw = w / scale; const sh = h / scale;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, w, h);
}
function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: string) {
  const widths = Array.from(seed || "POPOK").flatMap((char) => [1 + char.charCodeAt(0) % 4, 1 + char.charCodeAt(0) % 2]);
  const unit = w / widths.reduce((sum, value) => sum + value + 1, 0); let cursor = x;
  ctx.fillStyle = "#171411";
  widths.forEach((value, index) => { if (index % 2 === 0) ctx.fillRect(cursor, y, Math.max(2, value * unit), h); cursor += (value + 1) * unit; });
}

export async function createArtistStoryPng(artist: ArtistStoryCardData): Promise<Blob> {
  const canvas = document.createElement("canvas"); canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("이미지 캔버스를 만들지 못했습니다.");
  ctx.fillStyle = "#F8F8F5"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save(); ctx.shadowColor = "rgba(23,20,17,.18)"; ctx.shadowBlur = 48; ctx.shadowOffsetY = 22;
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 32); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.restore();
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 32); ctx.lineWidth = 3; ctx.strokeStyle = "#DED9CF"; ctx.stroke();

  const pad = 58; const left = CARD_X + pad; const right = CARD_X + CARD_W - pad;
  ctx.fillStyle = "#171411"; ctx.font = "950 44px Arial, sans-serif"; ctx.fillText("POPOK", left, CARD_Y + 92);
  ctx.fillStyle = "#C8EE52"; ctx.beginPath(); ctx.arc(left + 153, CARD_Y + 78, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#6F6A63"; ctx.font = "800 22px Arial, sans-serif"; ctx.textAlign = "right"; ctx.fillText("ARTIST ID CARD", right, CARD_Y + 88); ctx.textAlign = "left";
  ctx.strokeStyle = "#171411"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(left, CARD_Y + 122); ctx.lineTo(right, CARD_Y + 122); ctx.stroke();

  const imageX = left; const imageY = CARD_Y + 165; const imageW = CARD_W - pad * 2; const imageH = 560;
  roundRect(ctx, imageX, imageY, imageW, imageH, 24); ctx.save(); ctx.clip(); ctx.fillStyle = "#ECEBE6"; ctx.fillRect(imageX, imageY, imageW, imageH);
  const bitmap = await loadProfileBitmap(artist.profileImage);
  if (bitmap) { drawCover(ctx, bitmap, imageX, imageY, imageW, imageH); bitmap.close(); }
  else { ctx.fillStyle = "#171411"; ctx.font = "950 72px Arial, sans-serif"; ctx.textAlign = "center"; ctx.fillText("POPOK", imageX + imageW / 2, imageY + imageH / 2); ctx.fillStyle = "#C8EE52"; ctx.beginPath(); ctx.arc(imageX + imageW / 2 + 132, imageY + imageH / 2 - 24, 11, 0, Math.PI * 2); ctx.fill(); ctx.textAlign = "left"; }
  ctx.restore(); roundRect(ctx, imageX, imageY, imageW, imageH, 24); ctx.lineWidth = 2; ctx.strokeStyle = "#D7D2C9"; ctx.stroke();
  roundRect(ctx, imageX + 24, imageY + imageH - 72, 210, 48, 12); ctx.fillStyle = "#C8EE52"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#171411"; ctx.stroke();
  ctx.fillStyle = "#171411"; ctx.font = "900 20px Arial, sans-serif"; ctx.fillText("POPOK CERTIFIED", imageX + 42, imageY + imageH - 40);

  const titleY = imageY + imageH + 92; const nameSize = fitFont(ctx, artist.name, 430, 58, 36); ctx.font = `900 ${nameSize}px Arial, sans-serif`; ctx.fillStyle = "#171411"; ctx.fillText(artist.name, left, titleY);
  const genre = (artist.genre || artist.role || "CREATIVE").toUpperCase(); const genreSize = fitFont(ctx, genre, 260, 27, 18, 850); ctx.font = `850 ${genreSize}px Arial, sans-serif`; ctx.fillStyle = "#7FA315"; ctx.textAlign = "right"; ctx.fillText(genre, right, titleY); ctx.textAlign = "left";
  ctx.font = "500 26px Arial, sans-serif"; ctx.fillStyle = "#77716A"; const english = artist.nameEn || artist.name.toUpperCase(); ctx.fillText(english.length > 36 ? english.slice(0, 35) + "…" : english, left, titleY + 52);
  ctx.textAlign = "right"; ctx.fillText(instagramHandle(artist.instagram), right, titleY + 52); ctx.textAlign = "left";

  const footerY = CARD_Y + CARD_H - 168; ctx.strokeStyle = "#DDD8CF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left, footerY); ctx.lineTo(right, footerY); ctx.stroke();
  ctx.fillStyle = "#A39D94"; ctx.font = "500 16px monospace"; ctx.fillText("PORTFOLIO URL", left, footerY + 38);
  const displayUrl = `popok.kr/${artist.slug}`; const urlSize = fitFont(ctx, displayUrl, 430, 28, 20, 800); ctx.fillStyle = "#171411"; ctx.font = `800 ${urlSize}px monospace`; ctx.fillText(displayUrl, left, footerY + 82);
  drawBarcode(ctx, right - 160, footerY + 31, 160, 44, artist.id + artist.slug);
  ctx.fillStyle = "#77716A"; ctx.font = "500 13px monospace"; ctx.textAlign = "right"; ctx.fillText(`NO. ${artist.id.slice(0, 4).toUpperCase()}`, right, footerY + 96); ctx.textAlign = "left";

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG 생성에 실패했습니다.")), "image/png"));
}

export default function ArtistStoryShareModal({ open, onClose, artist, onToast }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null); const closeRef = useRef<HTMLButtonElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null); const [preview, setPreview] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const filename = `popok-${artist.slug}-story.png`;
  const generate = useCallback(async () => { setLoading(true); setError(""); try { const next = await createArtistStoryPng(artist); setBlob(next); setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(next); }); } catch (err) { setError(err instanceof Error ? err.message : "스토리 이미지를 만들지 못했습니다."); } finally { setLoading(false); } }, [artist]);
  useEffect(() => { if (!open) return; analytics.artistCardShareOpen(artist.id); void generate(); requestAnimationFrame(() => closeRef.current?.focus()); }, [open, artist.id, generate]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (!open) return; const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previousOverflow; }; }, [open]);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); if (event.key === "Tab" && dialogRef.current) { const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')).filter((node) => !node.hasAttribute("disabled")); if (!nodes.length) return; const first = nodes[0], last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open, onClose]);
  if (!open) return null;
  const download = () => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); analytics.artistCardStoryDownload(artist.id); setMessage("스토리 이미지가 저장되었습니다."); onToast?.("스토리 이미지가 저장되었습니다."); };
  const share = async () => { if (!blob) return; const file = new File([blob], filename, { type: "image/png" }); try { if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); analytics.artistCardNativeShare(artist.id); } else download(); } catch (err) { if ((err as DOMException)?.name !== "AbortError") { setError("공유할 수 없어 이미지 저장으로 전환했습니다."); download(); } } };
  const copy = async () => { await navigator.clipboard.writeText(artist.profileUrl); analytics.artistProfileLinkCopy(artist.id); setMessage("포트폴리오 주소가 복사되었습니다."); onToast?.("포트폴리오 주소가 복사되었습니다."); };
  return <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} style={{ position:"fixed",inset:0,zIndex:10000,background:"rgba(23,20,17,.68)",display:"grid",placeItems:"center",padding:"12px" }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-label="POPOK 디지털 명함 스토리 공유" style={{ width:"min(560px,100%)",maxHeight:"calc(100dvh - 24px)",overflowY:"auto",background:"#fff",borderRadius:"20px",padding:"18px",position:"relative" }}><button ref={closeRef} type="button" onClick={onClose} aria-label="공유 모달 닫기" style={{ position:"absolute",right:14,top:12,border:0,background:"transparent",fontSize:"1.5rem",cursor:"pointer" }}>×</button><h2 style={{margin:"2px 42px 14px 2px",fontSize:"1.1rem"}}>디지털 명함 공유</h2><div style={{width:"min(330px,78vw)",aspectRatio:"9/16",margin:"0 auto 16px",background:"#f5f5f2",border:"1px solid #ddd8cf",overflow:"hidden",display:"grid",placeItems:"center"}}>{loading?<span>스토리 이미지 생성 중...</span>:error&&!preview?<div style={{padding:20,textAlign:"center"}}><p>{error}</p><button type="button" onClick={generate}>다시 시도</button></div>:preview?<img src={preview} alt="인스타그램 스토리용 POPOK 디지털 명함 미리보기" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:null}</div>{error&&preview&&<p role="alert" style={{color:"#9d2b2b",fontSize:12}}>{error}</p>}{message&&<p role="status" style={{color:"#506b14",fontSize:12,fontWeight:800}}>{message}</p>}<div style={{display:"grid",gap:8}}><button type="button" disabled={!blob||loading} onClick={share} className="btn-lime" style={{padding:13,border:0,borderRadius:10,fontWeight:900}}>스토리로 공유하기</button><button type="button" disabled={!blob||loading} onClick={download} style={{padding:12,border:"1px solid #171411",borderRadius:10,background:"#fff",fontWeight:850}}>이미지 저장</button><button type="button" onClick={copy} style={{padding:12,border:"1px solid #d8d3ca",borderRadius:10,background:"#fff",fontWeight:850}}>링크 복사</button></div></div></div>;
}
