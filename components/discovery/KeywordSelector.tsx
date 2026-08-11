"use client";

export interface KeywordOption { id: string; label: string; terms?: readonly string[] }
export interface KeywordGroup { id: string; label: string; options: readonly KeywordOption[] }

export default function KeywordSelector({ groups, selectedIds, onToggle, onExplore, actionLabel }: {
  groups: readonly KeywordGroup[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onExplore: () => void;
  actionLabel: string;
}) {
  return (
    <section className="keyword-selector" aria-labelledby="keyword-selector-title">
      <div className="discovery-section-heading">
        <div><span className="mono">KEYWORD DISCOVERY</span><h2 id="keyword-selector-title">끌리는 키워드를 골라보세요</h2></div>
        <p>여러 항목을 자유롭게 선택할 수 있어요.</p>
      </div>
      <div className="keyword-groups">
        {groups.map((group) => (
          <fieldset key={group.id}>
            <legend>{group.label}</legend>
            <div className="keyword-options">
              {group.options.map((option) => (
                <button key={option.id} type="button" aria-pressed={selectedIds.includes(option.id)} onClick={() => onToggle(option.id)}>
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="keyword-selector-actions">
        <span>{selectedIds.length ? `${selectedIds.length}개 선택됨` : "키워드를 선택해 주세요"}</span>
        <button type="button" className="btn-lime" disabled={!selectedIds.length} onClick={onExplore}>
          {actionLabel} <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
