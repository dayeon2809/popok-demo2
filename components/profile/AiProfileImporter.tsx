"use client";

import { useRef, useState } from "react";
import styles from "./AiProfileImporter.module.css";

interface AiProfileImporterProps {
  onParsed: (data: any) => void;
  onCancel: () => void;
}

const RESUME_TEMPLATE = `이름
활동 분야 / 장르
짧은 자기소개
연락처 또는 활동 링크

[학력]
연도  학교·교육기관 / 전공

[작품 및 프로젝트]
연도  작품명
역할 / 한 줄 설명


[수상 및 선정]
연도  수상·선정명 / 주최 기관

[소속 및 경력]
활동 기간  단체·기관명 / 역할`;

const RESUME_EXAMPLE = `홍길동
공연예술 기획·창작

[학력]
2024–현재 00대학교 공연예술학과 재학

[작품 및 프로젝트]
2025 〈프로젝트 A〉
기획·연출

2024 〈프로젝트 B〉
창작·출연

[수상 및 선정]
2025 00예술지원사업
창작지원 대상 선정`;


export default function AiProfileImporter({ onParsed, onCancel }: AiProfileImporterProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg("");
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) return;
    const name = dropped.name.toLowerCase();
    if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".txt")) {
      setFile(dropped);
      setErrorMsg("");
    } else {
      setErrorMsg("PDF, DOCX, TXT 파일만 지원됩니다.");
    }
  };

  const copyTemplate = async () => {
    await navigator.clipboard.writeText(RESUME_TEMPLATE);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const startAiParsing = async () => {
    setErrorMsg("");
    setParsing(true);
    try {
      let response: Response;
      if (activeTab === "file") {
        if (!file) {
          setErrorMsg("업로드할 파일을 선택해 주세요.");
          setParsing(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch("/api/profile/parse", { method: "POST", body: formData });
      } else {
        if (!rawText.trim()) {
          setErrorMsg("정리할 활동 이력 내용을 입력해 주세요.");
          setParsing(false);
          return;
        }
        response = await fetch("/api/profile/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawText }),
        });
      }
      const data = await response.json();
      if (response.ok && data.success && data.data) onParsed(data.data);
      else setErrorMsg(data.error || "내용을 자동으로 정리하지 못했어요. 다른 파일을 사용하거나 텍스트를 직접 붙여넣어 주세요.");
    } catch {
      setErrorMsg("서버 연결에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setParsing(false);
    }
  };

  if (parsing) {
    return <div className={styles.loading}>
      <div className={styles.spinner} />
      <strong>AI가 활동 이력을 포트폴리오 형식으로 정리하고 있어요.</strong>
      <span>문서 길이에 따라 잠시 시간이 걸릴 수 있습니다.</span>
    </div>;
  }

  return <div className={styles.root}>
    <header className={styles.header}>
      <span className={styles.eyebrow}>AI 활동 이력 정리</span>
      <h2>작성해둔 예술 활동 이력이 있나요?</h2>
      <p>완벽한 이력서가 아니어도 괜찮아요.<br />학력, 작품, 활동, 수상 경력 등이 적힌 PDF 또는 문서를 올리면 POPOK가 내용을 읽고 포트폴리오 형식으로 정리해드려요.</p>
    </header>

    <div className={styles.tabs} role="tablist" aria-label="활동 이력 입력 방법">
      <button type="button" role="tab" aria-selected={activeTab === "file"} data-active={activeTab === "file"} onClick={() => setActiveTab("file")}>파일 올리기</button>
      <button type="button" role="tab" aria-selected={activeTab === "text"} data-active={activeTab === "text"} onClick={() => setActiveTab("text")}>텍스트 붙여넣기</button>
    </div>

    {activeTab === "file" ? <>
      <div className={styles.dropzone} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" />
        <span className={styles.fileIcon}>＋</span>
        <strong>{file ? file.name : "활동 이력 파일 선택"}</strong>
        <span>끌어다 놓거나 눌러서 선택하세요</span>
        <small>PDF · DOCX · TXT / 최대 10MB</small>
        <small>PDF 업로드가 되지 않는다면 텍스트로 복붙해서 넣어주세요!</small>
      </div>
    </> : <textarea className={styles.textarea} value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="작성해둔 활동 이력을 그대로 붙여넣어 주세요. 형식이 완벽하지 않아도 괜찮아요." rows={9} />}




    <details className={styles.details}>
      <summary>업로드 후 어떻게 진행되나요?</summary>
      <ol className={styles.processList}>
        <li><span>1</span><p>이력서 업로드</p></li>
        <li><span>2</span><p>AI가 활동 이력 정리</p></li>
        <li><span>3</span><p>정리된 내용을 직접 확인하고 수정</p></li>
        <li><span>4</span><p>작품 사진과 영상 추가</p></li>
        <li><span>5</span><p>포트폴리오 공개</p></li>
      </ol>
      <p className={styles.processNotice}>AI가 정리한 내용은 자동으로 확정되지 않으며, 공개 전 직접 수정하고 확인할 수 있어요.</p>
    </details>
    <details className={styles.details}>
      <summary>간단한 작성 예시 보기</summary>
      <pre className={styles.example}>{RESUME_EXAMPLE}</pre>
      <p className={styles.exampleNote}>위 내용은 형식 안내용이며 사용자 데이터로 저장하거나 자동 입력하지 않습니다.</p>
    </details>

    <details className={styles.details}>
      <summary>이력서 파일이 없어요</summary>
      <p className={styles.detailsIntro}>괜찮아요. 아래 양식을 복사해 메모장이나 문서에 작성하거나, 텍스트 입력 화면에 바로 붙여넣을 수 있어요. 대시보드에서 항목별로 직접 입력해도 됩니다.</p>
      <pre className={styles.template}>{RESUME_TEMPLATE}</pre>
      <div className={styles.templateActions}>
        <button type="button" onClick={copyTemplate}>{copied ? "복사 완료" : "간단한 양식 복사"}</button>
        <button type="button" onClick={() => setActiveTab("text")}>텍스트 직접 붙여넣기</button>
      </div>
    </details>

    <div className={styles.privacy}><span>!</span><p><strong>개인정보를 확인해주세요.</strong> 주민등록번호, 집 주소, 계좌번호처럼 포트폴리오에 필요하지 않은 민감정보는 지운 뒤 올려주세요. 원본 파일은 서버에 저장되지 않습니다.</p></div>
    {errorMsg && <div className={styles.error}>{errorMsg}</div>}

    <div className={styles.actions}>
      <button type="button" onClick={onCancel} className="btn-outline">대시보드에서 직접 입력</button>
      <button type="button" onClick={startAiParsing} className="btn-lime">활동 이력 정리 시작</button>
    </div>
  </div>;
}