// 약관·개인정보처리방침에 쓰이는 서비스/운영자 정보.
// ⚠️ 아래 대괄호 항목은 실제 값으로 바꿔주세요 (운영자 성명/상호, 연락처 등).
// 이 문서는 서비스 실제 동작에 맞춰 작성한 초안이며, 실제 배포 전 변호사 검토를
// 권장합니다 (개인정보보호법·전자상거래법 등 적용).
export const LEGAL = {
  serviceName: "달에게 가는 길",
  // 개인 개발자면 성명, 사업자면 상호를 적어주세요.
  operator: "[운영자 성명 또는 상호]",
  // 개인정보 보호책임자 성명 (개인 운영이면 운영자 본인 이름)
  privacyOfficer: "[개인정보 보호책임자 성명]",
  // 문의·개인정보 관련 연락 받을 이메일
  contactEmail: "[문의 이메일]",
  serviceUrl: "https://date-course-builder-production.up.railway.app",
  effectiveDate: "2026년 7월 15일",
} as const;
