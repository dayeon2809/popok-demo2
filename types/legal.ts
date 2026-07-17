export interface LegalItem {
  type: "paragraph" | "list";
  text?: string;        // Used when type is 'paragraph'
  listItems?: string[]; // Used when type is 'list'
}

export interface LegalSection {
  title: string;        // e.g. "제1조 (목적)"
  items: LegalItem[];
}

export interface LegalDocument {
  id: string;           // e.g. "terms", "privacy", "copyright"
  title: string;
  effectiveDate: string; // 시행일
  updatedDate: string;   // 최종 수정일
  description: string;
  sections: LegalSection[];
  contactEmail: string;
}
