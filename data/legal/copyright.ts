import { LegalDocument } from "@/types/legal";

export const copyrightContent: LegalDocument = {
  id: "copyright",
  title: "POPOK 저작권 및 콘텐츠 정책",
  effectiveDate: "2026년 7월 15일",
  updatedDate: "2026년 7월 15일",
  description: "POPOK는 예술가와 단체의 창작 활동을 존중하며, 모든 이용자의 저작권과 지식재산권을 보호하기 위해 본 정책을 운영합니다. 서비스를 이용하는 모든 회원은 본 정책을 준수하여야 합니다.",
  contactEmail: "popok.service@gmail.com",
  sections: [
    {
      title: "제1조 (목적)",
      items: [
        { type: "paragraph", text: "본 정책은 POPOK에 등록되는 작품, 공연, 이미지, 영상, 포트폴리오 및 기타 콘텐츠의 저작권을 보호하고, 건전한 창작 환경을 조성하기 위하여 마련되었습니다." }
      ]
    },
    {
      title: "제2조 (콘텐츠의 정의)",
      items: [
        { type: "paragraph", text: "본 정책에서 콘텐츠란 다음을 포함합니다." },
        {
          type: "list",
          listItems: [
            "작품 소개",
            "공연 정보",
            "전시 정보",
            "공연 사진",
            "작품 이미지",
            "영상",
            "포트폴리오",
            "이력 및 경력",
            "텍스트",
            "리뷰",
            "기타 회원이 등록하는 자료"
          ]
        }
      ]
    },
    {
      title: "제3조 (콘텐츠의 권리)",
      items: [
        { type: "paragraph", text: "회원이 직접 등록한 콘텐츠의 저작권은 원칙적으로 해당 회원 또는 정당한 권리자에게 있습니다." },
        { type: "paragraph", text: "POPOK는 서비스 운영을 위해 필요한 범위에서만 콘텐츠를 저장, 표시 및 제공합니다." },
        { type: "paragraph", text: "POPOK는 회원의 동의 없이 콘텐츠를 판매하거나 상업적으로 이용하지 않습니다." }
      ]
    },
    {
      title: "제4조 (회원의 책임)",
      items: [
        {
          type: "list",
          listItems: [
            "직접 창작한 콘텐츠이거나,",
            "적법한 이용 권한을 보유한 콘텐츠이며,",
            "제3자의 권리를 침해하지 않는 콘텐츠일 것"
          ]
        },
        { type: "paragraph", text: "회원은 등록한 콘텐츠로 인해 발생하는 법적 분쟁에 대하여 책임을 부담합니다." }
      ]
    },
    {
      title: "제5조 (이미지 및 영상 등록)",
      items: [
        { type: "paragraph", text: "회원은 다음과 같은 자료를 등록할 수 있습니다." },
        {
          type: "list",
          listItems: [
            "공연 사진",
            "작품 사진",
            "포스터",
            "프로필 이미지",
            "공연 영상",
            "쇼릴",
            "기타 포트폴리오 자료"
          ]
        },
        { type: "paragraph", text: "등록하는 모든 자료는 공개 가능한 권리를 보유하여야 합니다." }
      ]
    },
    {
      title: "제6조 (초상권)",
      items: [
        { type: "paragraph", text: "사진 및 영상에 등장하는 인물의 초상권은 관련 법령에 따라 보호됩니다." },
        { type: "paragraph", text: "회원은 필요한 경우 촬영 대상자의 동의 또는 공개 권한을 확보한 후 콘텐츠를 등록하여야 합니다." }
      ]
    },
    {
      title: "제7조 (금지되는 콘텐츠)",
      items: [
        { type: "paragraph", text: "다음과 같은 콘텐츠는 등록할 수 없습니다." },
        {
          type: "list",
          listItems: [
            "타인의 작품을 자신의 작품으로 등록하는 행위",
            "무단 복제한 사진",
            "무단 업로드한 공연 영상",
            "불법 다운로드한 콘텐츠",
            "허위 저작권 표시",
            "생성형 AI 결과물을 자신의 창작물인 것처럼 허위 표시하는 행위",
            "기타 타인의 권리를 침해하는 콘텐츠"
          ]
        }
      ]
    },
    {
      title: "제8조 (AI 생성 콘텐츠)",
      items: [
        { type: "paragraph", text: "POPOK의 AI 기능은 이용자가 제공한 자료를 정리하고 구조화하기 위한 도구입니다." },
        { type: "paragraph", text: "AI가 생성한 소개글이나 요약은 회원의 포트폴리오 작성을 지원하기 위한 참고자료입니다." },
        { type: "paragraph", text: "회원은 AI가 생성한 내용을 자신의 실제 경력이나 창작 활동과 다르게 수정하거나 허위 사실을 추가하여서는 안 됩니다." }
      ]
    },
    {
      title: "제9조 (콘텐츠 이용 범위)",
      items: [
        { type: "paragraph", text: "POPOK는 다음 목적에 한하여 콘텐츠를 이용할 수 있습니다." },
        {
          type: "list",
          listItems: [
            "포트폴리오 제공",
            "프로필 공개",
            "검색 결과 노출",
            "서비스 운영",
            "서비스 개선"
          ]
        },
        { type: "paragraph", text: "이 외의 목적으로 이용자의 콘텐츠를 활용하는 경우에는 별도의 동의를 받습니다." }
      ]
    },
    {
      title: "제10조 (삭제 요청)",
      items: [
        { type: "paragraph", text: "다음과 같은 경우 콘텐츠 삭제를 요청할 수 있습니다." },
        {
          type: "list",
          listItems: [
            "저작권 침해",
            "초상권 침해",
            "개인정보 노출",
            "명예훼손",
            "허위 정보",
            "기타 권리 침해"
          ]
        },
        { type: "paragraph", text: "운영자는 사실 확인 후 필요한 조치를 진행합니다." }
      ]
    },
    {
      title: "제11조 (신고 절차)",
      items: [
        { type: "paragraph", text: "권리 침해 신고를 하는 경우 다음 정보를 함께 제출해 주시기 바랍니다." },
        {
          type: "list",
          listItems: [
            "신고자 정보",
            "연락 가능한 이메일",
            "침해 대상 URL",
            "침해 사유",
            "권리 보유를 확인할 수 있는 자료"
          ]
        },
        { type: "paragraph", text: "필요한 경우 추가 자료를 요청할 수 있습니다." }
      ]
    },
    {
      title: "제12조 (콘텐츠의 임시 제한)",
      items: [
        { type: "paragraph", text: "POPOK는 다음의 경우 콘텐츠를 임시로 비공개 처리할 수 있습니다." },
        {
          type: "list",
          listItems: [
            "권리 침해 신고 접수",
            "허위 경력 의심",
            "명백한 저작권 침해",
            "법원의 결정",
            "관계기관의 요청"
          ]
        },
        { type: "paragraph", text: "운영자는 가능한 범위에서 당사자에게 이를 안내합니다." }
      ]
    },
    {
      title: "제13조 (창작자 존중 원칙)",
      items: [
        { type: "paragraph", text: "POPOK는 예술가의 창작 활동과 지식재산권을 존중합니다." },
        { type: "paragraph", text: "서비스는 창작자의 권리를 보호하고, 작품과 활동이 지속적으로 기록될 수 있는 건강한 디지털 아카이브를 지향합니다." },
        { type: "paragraph", text: "회원 또한 다른 창작자의 권리를 존중하며 서비스를 이용하여야 합니다." }
      ]
    }
  ]
};
