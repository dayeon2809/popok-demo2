import { LegalDocument } from "@/types/legal";

export const termsContent: LegalDocument = {
  id: "terms",
  title: "POPOK 이용약관",
  effectiveDate: "2026년 7월 15일",
  updatedDate: "2026년 7월 15일",
  description: "본 이용약관은 POPOK(이하 \"서비스\")가 제공하는 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
  contactEmail: "popok.service@gmail.com",
  sections: [
    {
      title: "제1조 (목적)",
      items: [
        { type: "paragraph", text: "본 약관은 POPOK가 제공하는 예술가 포트폴리오 관리 및 아카이빙 서비스(이하 \"서비스\")의 이용조건 및 절차, 서비스와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다." }
      ]
    },
    {
      title: "제2조 (정의)",
      items: [
        { type: "paragraph", text: "본 약관에서 사용하는 용어의 의미는 다음과 같습니다." },
        {
          type: "list",
          listItems: [
            "서비스란 POPOK가 제공하는 웹사이트 및 관련 서비스를 의미합니다.",
            "이용자란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 의미합니다.",
            "회원이란 Google 계정 등을 이용하여 가입한 이용자를 의미합니다.",
            "콘텐츠란 회원이 서비스에 등록한 작품, 공연, 이미지, 영상, 텍스트, 포트폴리오 및 기타 자료를 의미합니다.",
            "AI 서비스란 회원이 제공한 자료를 분석하여 포트폴리오 작성 및 정리를 지원하는 기능을 의미합니다."
          ]
        }
      ]
    },
    {
      title: "제3조 (약관의 효력 및 변경)",
      items: [
        { type: "paragraph", text: "본 약관은 서비스에 게시함으로써 효력이 발생합니다." },
        { type: "paragraph", text: "서비스는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다." },
        { type: "paragraph", text: "중요한 변경사항은 서비스 내 공지사항 등을 통해 사전에 안내합니다." }
      ]
    },
    {
      title: "제4조 (회원가입)",
      items: [
        { type: "paragraph", text: "이용자는 Google 로그인 등 서비스가 제공하는 방법으로 회원가입을 할 수 있습니다." },
        { type: "paragraph", text: "회원가입 시 이용자는 본 약관 및 개인정보처리방침에 동의한 것으로 봅니다." },
        { type: "paragraph", text: "다음의 경우 회원가입이 제한될 수 있습니다." },
        {
          type: "list",
          listItems: [
            "타인의 정보를 도용한 경우",
            "허위 정보를 입력한 경우",
            "관련 법령을 위반한 경우",
            "서비스 운영을 현저히 방해할 우려가 있는 경우"
          ]
        }
      ]
    },
    {
      title: "제5조 (서비스의 내용)",
      items: [
        { type: "paragraph", text: "POPOK는 다음의 서비스를 제공합니다." },
        {
          type: "list",
          listItems: [
            "예술가 프로필 생성",
            "포트폴리오 관리",
            "작품 및 활동 이력 등록",
            "공개 프로필 제공",
            "AI 기반 포트폴리오 작성 지원",
            "운영자 검수를 통한 공개",
            "기타 서비스 운영에 필요한 기능"
          ]
        },
        { type: "paragraph", text: "서비스 내용은 운영 정책에 따라 변경될 수 있습니다." }
      ]
    },
    {
      title: "제6조 (운영자 검수)",
      items: [
        { type: "paragraph", text: "서비스는 등록된 프로필 또는 콘텐츠를 운영자의 검수 후 공개할 수 있습니다." },
        { type: "paragraph", text: "다음의 경우 공개가 제한될 수 있습니다." },
        {
          type: "list",
          listItems: [
            "허위 경력",
            "타인의 저작물 무단 등록",
            "부적절하거나 불법적인 콘텐츠",
            "서비스 운영 목적에 맞지 않는 경우"
          ]
        },
        { type: "paragraph", text: "운영자는 필요한 경우 수정 요청 또는 공개 보류를 할 수 있습니다." }
      ]
    },
    {
      title: "제7조 (AI 서비스)",
      items: [
        { type: "paragraph", text: "이용자는 AI 기능을 이용하여 포트폴리오 작성 지원을 받을 수 있습니다." },
        { type: "paragraph", text: "AI는 이용자의 입력 자료를 바탕으로 결과를 생성합니다." },
        { type: "paragraph", text: "생성된 결과의 정확성은 보장되지 않으며, 이용자는 공개 전 내용을 직접 확인하고 수정하여야 합니다." },
        { type: "paragraph", text: "AI 기능은 서비스 개선을 위하여 변경되거나 종료될 수 있습니다." }
      ]
    },
    {
      title: "제8조 (회원의 의무)",
      items: [
        { type: "paragraph", text: "회원은 다음 행위를 하여서는 안 됩니다." },
        {
          type: "list",
          listItems: [
            "타인의 개인정보 도용",
            "허위 경력 등록",
            "타인의 작품 무단 업로드",
            "저작권 침해",
            "명예훼손",
            "불법 콘텐츠 게시",
            "시스템 해킹 또는 비정상적 접근",
            "서비스 운영 방해"
          ]
        },
        { type: "paragraph", text: "회원은 자신의 계정을 안전하게 관리할 책임이 있습니다." }
      ]
    },
    {
      title: "제9조 (콘텐츠의 권리)",
      items: [
        { type: "paragraph", text: "회원이 등록한 작품 및 콘텐츠의 저작권은 원칙적으로 해당 회원에게 있습니다." },
        { type: "paragraph", text: "회원은 서비스 운영을 위해 필요한 범위에서 POPOK가 해당 콘텐츠를 저장, 표시 및 서비스 내에서 제공하는 것에 동의합니다." },
        { type: "paragraph", text: "POPOK는 서비스 운영 목적 외에는 회원의 콘텐츠를 임의로 판매하거나 이용하지 않습니다." }
      ]
    },
    {
      title: "제10조 (서비스의 변경 및 중단)",
      items: [
        { type: "paragraph", text: "서비스는 다음의 경우 일부 또는 전부를 변경하거나 중단할 수 있습니다." },
        {
          type: "list",
          listItems: [
            "시스템 점검",
            "서버 유지보수",
            "기술적 문제",
            "서비스 개선",
            "불가항력적인 사유"
          ]
        },
        { type: "paragraph", text: "서비스는 가능한 범위에서 사전에 안내하도록 노력합니다." }
      ]
    },
    {
      title: "제11조 (회원탈퇴)",
      items: [
        { type: "paragraph", text: "회원은 언제든지 탈퇴를 요청할 수 있습니다." },
        { type: "paragraph", text: "회원탈퇴 시 개인정보는 개인정보처리방침에 따라 처리됩니다." },
        { type: "paragraph", text: "공개 포트폴리오는 삭제 또는 비공개 처리됩니다." }
      ]
    },
    {
      title: "제12조 (서비스 이용 제한)",
      items: [
        { type: "paragraph", text: "서비스는 다음의 경우 이용을 제한하거나 계정을 정지할 수 있습니다." },
        {
          type: "list",
          listItems: [
            "반복적인 운영 방해",
            "타인의 권리 침해",
            "허위 정보 등록",
            "법령 위반",
            "본 약관 위반"
          ]
        },
        { type: "paragraph", text: "필요한 경우 사전 통지 없이 긴급 조치가 이루어질 수 있습니다." }
      ]
    },
    {
      title: "제13조 (면책)",
      items: [
        { type: "paragraph", text: "POPOK는 천재지변, 시스템 장애 등 불가항력으로 발생한 손해에 대해 책임을 지지 않습니다." },
        { type: "paragraph", text: "회원이 등록한 정보의 정확성은 회원 본인의 책임입니다." },
        { type: "paragraph", text: "AI가 생성한 결과는 참고용이며, 최종 검토와 공개 책임은 회원에게 있습니다." },
        { type: "paragraph", text: "회원 간 또는 회원과 제3자 사이에서 발생한 분쟁에 대하여 POPOK는 법령상 책임이 있는 경우를 제외하고 책임을 지지 않습니다." }
      ]
    },
    {
      title: "제14조 (지식재산권)",
      items: [
        { type: "paragraph", text: "서비스의 디자인, 로고, 명칭, UI, 프로그램 및 기타 저작물에 대한 권리는 POPOK에 귀속됩니다." },
        { type: "paragraph", text: "회원은 서비스의 사전 승인 없이 이를 복제, 배포 또는 상업적으로 이용할 수 없습니다." }
      ]
    },
    {
      title: "제15조 (준거법 및 관할)",
      items: [
        { type: "paragraph", text: "본 약관은 대한민국 법률에 따라 해석됩니다." },
        { type: "paragraph", text: "서비스 이용과 관련하여 분쟁이 발생하는 경우 대한민국 법원을 관할 법원으로 합니다." }
      ]
    }
  ]
};
