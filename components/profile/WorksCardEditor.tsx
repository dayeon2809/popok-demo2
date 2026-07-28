"use client";

import { useEffect, useRef, useState } from "react";
import { creditsToDisplayString, normalizeWorkImages } from "@/lib/works";
import styles from "./WorksCardEditor.module.css";

export interface EditableWork {
  id: string;
  title: string;
  year?: string | number | null;
  description?: string;
  role?: string;
  image_url?: string;
  images?: string[];
  video_url?: string;
  credits?: unknown;
}

interface WorksCardEditorProps {
  works: EditableWork[];
  canAdd: boolean;
  countLabel: string;
  uploadingSlot: string | null;
  onAdd: () => string;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof EditableWork, value: unknown) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>, workIndex: number, imageIndex: number) => void;
  onImageRemove: (workIndex: number, imageIndex: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function WorksCardEditor({ works, canAdd, countLabel, uploadingSlot, onAdd, onRemove, onChange, onImageUpload, onImageRemove, onReorder }: WorksCardEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(works[0]?.id || null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, works.findIndex((work) => work.id === selectedId));
  const selectedWork = works[selectedIndex];

  useEffect(() => {
    if (works.length === 0) setSelectedId(null);
    else if (!selectedId || !works.some((work) => work.id === selectedId)) setSelectedId(works[0].id);
  }, [works, selectedId]);

  const selectWork = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const addWork = () => {
    const id = onAdd();
    setSelectedId(id);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const removeSelected = () => {
    if (!selectedWork || !window.confirm(`“${selectedWork.title || "새 작품"}”을 삭제할까요?`)) return;
    const nextWork = works[selectedIndex + 1] || works[selectedIndex - 1];
    onRemove(selectedIndex);
    setSelectedId(nextWork?.id || null);
  };

  return <div className={styles.shell}>
    <div className={styles.heading}>
      <div><h2>3. 작품 및 프로젝트</h2><p>갤러리에서 작품을 선택해 세부 정보를 수정하세요. 카드 드래그로 순서를 바꿀 수 있습니다.</p></div>
      <span className={styles.count}>{countLabel}</span>
    </div>

    <div className={styles.workspace}>
      <aside className={styles.cardRail} aria-label="작품 목록">
        {works.map((work, index) => {
          const thumbnail = normalizeWorkImages(work)[0];
          const selected = work.id === selectedId;
          return <button key={work.id || index} type="button" className={styles.workCard} data-selected={selected} onClick={() => selectWork(work.id)} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedIndex !== null && draggedIndex !== index) onReorder(draggedIndex, index); setDraggedIndex(null); }}>
            <div className={styles.thumbnail}>{thumbnail ? <img src={thumbnail} alt="" /> : <span>POPOK</span>}</div>
            <div className={styles.cardCopy}><strong>{work.title.trim() || "새 작품"}</strong><span>{work.year || "연도 미입력"}</span><span>{work.role || "역할 미입력"}</span></div>
            <span className={styles.order}>{index + 1}</span>
          </button>;
        })}
        {canAdd && <button type="button" className={styles.addCard} onClick={addWork}><span>＋</span><strong>새 작품 추가</strong></button>}
      </aside>

      <div ref={editorRef} className={styles.editorPane}>
        {!selectedWork ? <div className={styles.empty}><span>📁</span><p>등록된 작품이 없습니다.</p>{canAdd && <button type="button" onClick={addWork}>＋ 첫 작품 추가</button>}</div> : <>
          <div className={styles.editorHeader}><div><span>작품 {selectedIndex + 1}</span><h3>{selectedWork.title.trim() || "새 작품"}</h3></div><button type="button" className={styles.deleteButton} onClick={removeSelected}>✕ 작품 삭제</button></div>
          <div className={styles.twoColumns}>
            <label>작품명 (Title)<input type="text" value={selectedWork.title} onChange={(event) => onChange(selectedIndex, "title", event.target.value)} placeholder="작품 제목" /></label>
            <label>제작년도 (Year)<input type="text" value={selectedWork.year || ""} onChange={(event) => onChange(selectedIndex, "year", event.target.value)} placeholder="예: 2025" /></label>
            <label>나의 역할 (Role)<input type="text" value={selectedWork.role || ""} onChange={(event) => onChange(selectedIndex, "role", event.target.value)} placeholder="예: 안무 및 출연" /></label>
            <label>작품 영상 URL<input type="text" value={selectedWork.video_url || ""} onChange={(event) => onChange(selectedIndex, "video_url", event.target.value)} placeholder="https://..." /></label>
          </div>
          <label className={styles.description}>작품 소개 요약 (Description)<textarea value={selectedWork.description || ""} onChange={(event) => onChange(selectedIndex, "description", event.target.value)} placeholder="작품에 대한 간단한 설명을 입력해 주세요." rows={4} /></label>
          <label className={styles.description}>작품 크레딧 (Credits)<textarea value={typeof selectedWork.credits === "string" ? selectedWork.credits : creditsToDisplayString(selectedWork)} onChange={(event) => onChange(selectedIndex, "credits", event.target.value)} placeholder={"자유롭게 입력해 주세요.\n예) 공동창작 및 출연 김예술, 이포퐄 / 인터뷰 홍길동"} rows={4} /><span style={{ fontSize: ".68rem", color: "var(--ink-muted)", fontWeight: 600 }}>문장이나 메모처럼 자유롭게 입력해도 저장할 때 역할별 크레딧으로 정리됩니다.</span></label>
          <div className={styles.imagesHeader}><strong>작품 이미지</strong><span>{normalizeWorkImages(selectedWork).length} / 8장 · 첫 이미지가 대표 썸네일로 표시됩니다.</span></div>
          <div className={styles.imageGrid}>{Array.from({ length: 8 }, (_, imageIndex) => imageIndex).map((imageIndex) => {
            const imageUrl = normalizeWorkImages(selectedWork)[imageIndex];
            const uploading = uploadingSlot === `work_${selectedIndex}_${imageIndex}`;
            return <div className={styles.imageSlot} key={imageIndex}>{imageUrl ? <><img src={imageUrl} alt={`${selectedWork.title || "작품"} 이미지 ${imageIndex + 1}`} /><button type="button" onClick={() => onImageRemove(selectedIndex, imageIndex)} aria-label={`${imageIndex + 1}번 이미지 삭제`}>×</button></> : <><input id={`work-card-image-${selectedWork.id}-${imageIndex}`} type="file" accept="image/*" multiple disabled={Boolean(uploadingSlot)} onChange={(event) => onImageUpload(event, selectedIndex, imageIndex)} /><label htmlFor={`work-card-image-${selectedWork.id}-${imageIndex}`}><span>{uploading ? "⏳" : "＋"}</span>{uploading ? "업로드 중" : `이미지 ${imageIndex + 1}`}</label></>}</div>;
          })}</div>
        </>}
      </div>
    </div>
  </div>;
}