/* KRVCF App Center — i18n (Korean / English)
 * Translates rendered text, placeholders and titles using a dictionary.
 * - Tries: exact match → regex rules → per-fragment translation split on " · " / " / "
 * - User-generated content (app names, descriptions, …) is excluded via [data-notr] and SKIP selectors
 */
(() => {
  'use strict';
  const KEY = 'krvcf.lang';
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (_) { /* noop */ }
  const lang = saved === 'en' || saved === 'ko' ? saved : (/^ko\b/i.test(navigator.language || '') ? 'ko' : 'en');
  document.documentElement.lang = lang;

  const EN = {
    // ── Common / navigation
    '탐색': 'Browse', '작업': 'Tasks', '홈': 'Home', '전체 앱': 'All apps', '카탈로그': 'Catalog', '데모룸': 'Demo Room', '즐겨찾기': 'Favorites',
    '앱 등록': 'Submit app', '내 워크스페이스': 'My Workspace', '관리 콘솔': 'Admin Console', '내 앱': 'My apps', '관리': 'Admin', '등록': 'Submit',
    '로그인': 'Sign in', '로그아웃': 'Sign out', '최근 작업': 'Recent Tasks', 'API 연결됨': 'API connected', 'API 연결 실패': 'API unreachable', 'API 확인 중': 'Checking API',
    '앱 이름, 설명, 작성자 검색': 'Search apps, descriptions, authors', '앱 이름, 설명, 작성자, #태그 검색': 'Search apps, authors, #tags', '+ 앱 등록': '+ Submit app', '라이트/다크 테마': 'Light/Dark theme',
    '승인자·관리자 로그인': 'Approver / admin sign-in', '메뉴': 'Menu', '하단 메뉴': 'Bottom menu', '홈으로': 'Go home', '페이지를 찾을 수 없습니다': 'Page not found',
    '비공식 커뮤니티 페이지입니다. VMware·Broadcom의 공식 서비스가 아니며, 등록된 앱의 책임은 작성자에게 있습니다.': 'Unofficial community site. Not an official VMware or Broadcom service; each app is the responsibility of its author.',
    '작업 이름': 'Task', '대상': 'Target', '상태': 'Status', '시작 시간': 'Started', '완료 시간': 'Completed', '아직 작업이 없습니다.': 'No tasks yet.',
    '진행 중': 'Running', '완료': 'Completed', '실패': 'Failed', '성공': 'Success', '취소': 'Cancel', '확인': 'OK', '닫기': 'Close', '닫기 (Esc)': 'Close (Esc)',
    '저장': 'Save', '삭제': 'Delete', '수정': 'Edit', '실행': 'Run', '공유': 'Share', '보내기': 'Send', '검토': 'Review', '승인': 'Approve', '반려': 'Reject',
    '대기로': 'Set pending', '새로고침': 'Refresh', '모두 보기': 'View all', '더 보기': 'Load more', '제거': 'Remove', '가져오기': 'Import', '복사': 'Copy',
    '다음': 'Next', '뒤로': 'Back', '적용': 'Apply', '롤백': 'Roll back', '복원': 'Restore', '초기화': 'Reset', '활성화': 'Activate', '비활성화': 'Deactivate',
    '활성': 'Active', '비활성': 'Inactive', '없음': 'None', '전체': 'All', '현재': 'Now', '최근': 'Recent', '신규': 'New', '변경': 'Modified', '동일': 'Same',
    '이름': 'Name', '이메일': 'Email', '역할': 'Role', '유형': 'Type', '카테고리': 'Category', '설명': 'Description', '작성자': 'Author', '평점': 'Rating',
    '조회': 'Views', '시간': 'Time', '사용자': 'User', '결과': 'Result', '내용': 'Message', '크기': 'Size', '날짜': 'Date', '국가': 'Country', '페이지': 'Page',
    '추천': 'Featured', '등록일': 'Submitted', '수정일': 'Updated', '앱 ID': 'App ID', '앱 이름': 'App name', '앱 URL': 'App URL', '파일 크기': 'File size',
    '세션': 'Sessions', '작성': 'Author', '커밋': 'Commit', '메시지': 'Message', '경로': 'Path', '파일': 'File', '코드': 'Code', '소스': 'Source', '설정': 'Settings',
    '요약': 'Summary', '보안': 'Security', '도구': 'Tools', '컴퓨트': 'Compute', '스토리지': 'Storage', '네트워크': 'Network', 'DR / 백업': 'DR / Backup', '대시보드': 'Dashboard',
    '웹 링크': 'Web link', 'HTML 데모': 'HTML demo', '앱': 'App', '승인 대기': 'Pending', '승인됨': 'Approved', '반려됨': 'Rejected', '삭제됨': 'Deleted', '키 불일치': 'Key mismatch',
    '나': 'Me', '알 수 없음': 'Unknown', '데스크톱': 'Desktop', '모바일': 'Mobile', '태블릿': 'Tablet', '직접 방문': 'Direct', '(직접 방문)': '(Direct)',
    '최고 관리자': 'Super admin', '관리자': 'Admin', '승인자': 'Approver', '게스트': 'Guest',

    // ── Home
    'KRVCF App Center': 'KRVCF App Center',
    'VCF 커뮤니티가 만든 미니 앱과 HTML 시뮬레이터를 공유하고 바로 실행하세요.': 'Share and instantly run mini apps and HTML simulators built by the VCF community.',
    '전체 앱 보기': 'Browse all apps', '등록된 앱': 'Apps', '누적 실행': 'Total runs', '오늘 방문자': 'Visitors today', '누적 방문자': 'Total visitors', '현재 접속': 'Online now',
    '최근 3분 기준': 'Last 3 minutes', '추천 앱': 'Featured apps', '이번 주 인기': 'Trending this week', '최근 7일 조회·실행': 'Views · runs, last 7 days', '최근 본 앱': 'Recently viewed',
    '최근 등록': 'Recently added', '아직 등록된 앱이 없습니다.': 'No apps yet.', '첫 앱을 등록해 보세요 →': 'Submit the first one →',
    'Legal Notice & Disclaimer': 'Legal Notice & Disclaimer',
    '— 본 사이트는 비공식 커뮤니티 페이지이며 VMware 또는 Broadcom의 공식 서비스가 아닙니다. 등록된 앱은 작성자의 책임이며, 데모룸 HTML 앱은 격리된 샌드박스에서 실행됩니다. 앱 사용으로 인한 문제나 데이터 손실에 대한 책임은 사용자에게 있습니다.':
      '— This is an unofficial community site and not an official VMware or Broadcom service. Apps are the responsibility of their authors, and Demo Room HTML apps run in an isolated sandbox. Users are responsible for any issues or data loss arising from use.',

    // ── Lists
    '등록된 모든 미니 앱과 시뮬레이터': 'All mini apps and simulators',
    '외부 웹 링크로 연결되는 미니 앱 — 새 탭에서 실행됩니다.': 'Mini apps hosted elsewhere — open in a new tab.',
    '첨부된 HTML 시뮬레이터 — 격리된 전체 화면 모달에서 즉시 실행됩니다.': 'Uploaded HTML simulators — run instantly in an isolated full-screen view.',
    '별표로 저장한 앱 (이 브라우저에 저장)': 'Apps you starred (saved in this browser)',
    '목록 내 필터': 'Filter this list', '인기순 (실행 수)': 'Most run', '조회순': 'Most viewed', '평점 높은 순': 'Top rated', '최신 등록순': 'Newest', '이름순 (가나다)': 'Name (A–Z)',
    '카드 보기': 'Card view', '목록 보기': 'List view', '앱이 없습니다': 'No apps', '검색 조건에 맞는 앱이 없습니다.': 'No apps match your search.',
    '이 분류에 등록된 앱이 아직 없습니다.': 'No apps in this category yet.', '목록 새로고침': 'Refresh list',
    '즐겨찾기 해제': 'Remove from favorites', '즐겨찾기에 추가했습니다.': 'Added to favorites.', '즐겨찾기에서 제거했습니다.': 'Removed from favorites.',

    // ── Detail / runner
    '앱 실행': 'Run app', '앱 정보': 'App info', '사용 현황': 'Usage', '조회 수': 'Views', '실행 수': 'Runs', '평균 평점': 'Avg. rating', '승인 이력': 'Review history',
    '평가 및 피드백': 'Rating & feedback', '이 앱을 평가해 주세요': 'Rate this app', '작성자·관리자에게 전달할 의견을 남겨 주세요': 'Leave feedback for the author and admins',
    '데모룸 · HTML 시뮬레이터 (샌드박스 실행)': 'Demo Room · HTML simulator (sandboxed)', '카탈로그 · 외부 웹 링크': 'Catalog · external web link',
    '앱을 찾을 수 없습니다': 'App not found', '전체 앱으로': 'Back to all apps', '최종 검토:': 'Last reviewed:', '관리자 메모:': 'Admin note:',
    '이 앱은': 'This app is', '상태라 소유자와 관리자에게만 보입니다.': 'and is visible only to its owner and admins.',
    '이력이 없습니다.': 'No history.', '등록 요청': 'Submitted', '수정 후 재요청': 'Resubmitted after edit', '승인 대기로 변경': 'Set to pending', '관리자 수정': 'Edited by admin',
    '앱 삭제': 'Delete app', '앱을 삭제합니다. 평점·피드백도 함께 삭제되며 되돌릴 수 없습니다.': 'will be deleted along with its ratings and feedback. This cannot be undone.',
    '삭제했습니다.': 'Deleted.', '불러오는 중…': 'Loading…', '피드백': 'Feedback', '새 탭': 'New tab', '새 탭에서 열기': 'Open in new tab', '전체화면': 'Full screen',
    '미리보기': 'Preview', '전체화면을 사용할 수 없습니다.': 'Full screen is not available.', '새 탭에서 열림': 'Opened in new tab', '데모룸 모달에서 실행': 'Running in Demo Room',
    '개선 의견이나 오류를 작성자·관리자에게 전달합니다.': 'Send suggestions or bug reports to the author and admins.', '의견을 입력하세요 (최대 1,000자)': 'Your feedback (max 1,000 characters)',
    '피드백 내용을 입력하세요.': 'Please enter your feedback.', '피드백을 보냈습니다.': 'Feedback sent.', '공유 링크를 복사했습니다:': 'Share link copied:',
    '평점 제출': 'Submit rating', '피드백 전송': 'Send feedback', '공유 링크 복사': 'Copy share link', '앱 실행 ': 'Run app',

    // ── Submit wizard
    '새 앱 등록': 'Submit a new app', '앱 수정': 'Edit app', '유형 선택': 'Choose type', '기본 정보': 'Details', '검토 및 완료': 'Review & finish',
    '앱이 표시될 위치와 실행 방식을 선택하세요.': 'Choose where the app appears and how it runs.',
    '데모룸 — HTML 시뮬레이터': 'Demo Room — HTML simulator', '카탈로그 — 외부 웹 링크': 'Catalog — external web link',
    '단일 HTML 파일(최대 10MB)을 업로드하면 격리된 샌드박스에서 전체 화면 모달로 즉시 실행됩니다. 계산기, 사이징 도구, UI 시뮬레이터에 적합합니다.': 'Upload a single HTML file (up to 10 MB) and it runs instantly in an isolated full-screen sandbox. Great for calculators, sizing tools and UI simulators.',
    '이미 호스팅 중인 웹앱(https)을 링크로 등록합니다. 실행 시 새 탭으로 열립니다.': 'Register a web app you already host (https). It opens in a new tab.',
    '카탈로그에 표시될 정보를 입력하세요.': 'Enter the information shown in the catalog.', '작성자 이름': 'Author name', '작성자 이메일': 'Author email',
    '예: vSAN ESA 용량 계산기': 'e.g. vSAN ESA capacity calculator', '표시될 이름 또는 닉네임': 'Display name or nickname',
    '관리자에게만 보이며, 승인 관련 연락에 사용됩니다.': 'Visible only to admins; used for review notifications.', '선택하세요': 'Select',
    '무엇을 하는 앱인지, 사용법과 참고 사항을 적어 주세요.': 'Describe what the app does, how to use it, and any notes.', '썸네일 URL': 'Thumbnail URL',
    'https://… (비워 두면 그라데이션 자동 생성)': 'https://… (leave empty for an auto gradient)',
    '이미지 https 주소. 비워 두면 카테고리 아이콘이 들어간 그라데이션 썸네일이 자동 생성됩니다.': 'Image https URL. Leave empty to generate a gradient thumbnail with the category icon.',
    '실행 시 새 탭으로 열릴 웹앱 주소를 입력하세요.': 'Enter the web app URL to open in a new tab.', 'https:// 로 시작하는 주소만 허용됩니다.': 'Only https:// URLs are allowed.',
    'HTML 소스': 'HTML source', '단일 HTML 파일을 업로드하거나 코드를 붙여넣으세요. CSS/JS는 파일 안에 포함하거나 CDN을 사용하세요.': 'Upload a single HTML file or paste the code. Inline your CSS/JS or load it from a CDN.',
    '파일 업로드': 'Upload file', '직접 붙여넣기': 'Paste code', 'HTML 파일 선택': 'Choose an HTML file', '또는 여기로 끌어다 놓기': 'or drag it here', '.html / .htm · 최대 10MB': '.html / .htm · up to 10 MB',
    '업로드된 HTML은 별도 도메인의': 'Uploaded HTML runs in a', '샌드박스(불투명 origin)': 'sandbox (opaque origin)',
    '에서 실행되어 플랫폼·다른 앱의 데이터에 접근할 수 없습니다. localStorage는 실행 중 메모리로 대체됩니다.': ' on a separate domain, so it cannot access the platform or other apps. localStorage is replaced with in-memory storage.',
    '입력 내용을 확인하세요.': 'Check your entries.', '수정하면 다시 관리자 승인 대기 상태가 됩니다.': 'Saving changes sends the app back for approval.',
    '등록 후 관리자 승인을 거쳐 공개됩니다.': 'It will be published after approval.', '실행 미리보기': 'Run preview', '붙여넣은 코드': 'Pasted code', '현재 등록된 HTML': 'Current HTML',
    '앱에 악성 코드·개인정보·저작권 침해 요소가 없으며, 게시에 대한 책임이 본인에게 있음에 동의합니다.': 'I confirm the app contains no malicious code, personal data or copyright infringement, and I take responsibility for publishing it.',
    '처리 중…': 'Processing…', '앱 등록 요청': 'Submit app', '수정 사항을 저장했습니다': 'Changes saved', '앱이 등록·공개되었습니다': 'Your app is live',
    '등록 요청이 완료되었습니다': 'Submission received', '지금 바로 카탈로그에서 확인할 수 있습니다.': 'You can see it in the catalog right now.',
    '관리자 승인 후 카탈로그에 공개됩니다. 상태는 내 워크스페이스에서 확인하세요.': 'It will appear in the catalog once approved. Track its status in My Workspace.',
    '소유 키를 안전하게 보관하세요.': 'Keep your owner key safe.',
    '이 키가 있어야 앱을 수정·삭제할 수 있습니다. 이 브라우저에는 자동 저장되었고, 다른 기기에서는 내 워크스페이스 → 소유 키 가져오기로 등록하세요.': 'You need this key to edit or delete the app. It is saved in this browser; on other devices use My Workspace → Import owner key.',
    '소유 키': 'Owner key', '앱 상세 보기': 'View app', '다른 앱 등록': 'Submit another', '앱 ID와 소유 키를 복사했습니다.': 'App ID and owner key copied.',
    '앱 이름을 입력하세요.': 'Please enter an app name.', '작성자 이름을 입력하세요.': 'Please enter the author name.', '이메일 형식이 올바르지 않습니다.': 'Invalid email address.',
    '카테고리를 선택하세요.': 'Please choose a category.', '설명을 입력하세요.': 'Please enter a description.', '썸네일은 https:// 주소만 가능합니다.': 'Thumbnail must be an https:// URL.',
    'https:// 로 시작하는 URL을 입력하세요.': 'Enter a URL starting with https://.', 'HTML 파일을 업로드하거나 코드를 붙여넣으세요.': 'Upload an HTML file or paste code.',
    'HTML은 10MB 이하만 가능합니다.': 'HTML must be 10 MB or smaller.', 'HTML 파일은 10MB 이하만 가능합니다.': 'HTML files must be 10 MB or smaller.',
    '.html 또는 .htm 파일만 업로드할 수 있습니다.': 'Only .html or .htm files can be uploaded.', '파일을 읽을 수 없습니다.': 'Cannot read the file.', '변경 없음': 'unchanged',
    '이 브라우저에 해당 앱의 소유 키가 없습니다.': 'This browser has no owner key for this app.', '에서 소유 키를 가져오세요.': ' — import the owner key there.',
    '자동 생성': 'Auto-generated',

    // ── My Workspace
    '이 브라우저에 저장된 소유 키로 내가 등록한 앱의 승인 상태를 확인하고 관리합니다.': 'Track and manage the apps you submitted, using owner keys saved in this browser.',
    '소유 키 가져오기': 'Import owner key', '키 내보내기': 'Export keys', '소유 키 내보내기': 'Export owner keys', '등록한 앱이 없습니다': 'No submitted apps',
    '앱을 등록하면 이 브라우저에 소유 키가 저장되어 여기에서 관리할 수 있습니다.': 'When you submit an app, its owner key is saved in this browser so you can manage it here.',
    '첫 앱 등록': 'Submit your first app', '목록에서 제거': 'Remove from list',
    '소유 키는 이 브라우저(localStorage)에만 저장됩니다. 브라우저 데이터를 지우기 전에 “키 내보내기”로 백업하세요.': 'Owner keys live only in this browser (localStorage). Back them up with “Export keys” before clearing browser data.',
    '다른 브라우저에서 등록한 앱을 관리하려면 앱 ID와 소유 키를 입력하거나, 내보낸 키 파일(JSON)을 선택하세요.': 'To manage apps submitted from another browser, enter the app ID and owner key, or choose an exported key file (JSON).',
    '예: a1b2c3d4e5': 'e.g. a1b2c3d4e5', '등록 완료 화면에 표시된 키': 'Key shown after submission', 'JSON 파일에서 가져오기': 'Import from JSON file',
    '앱 ID와 소유 키를 입력하세요.': 'Enter the app ID and owner key.', '키 항목이 없습니다.': 'No keys found.', '키 파일을 읽을 수 없습니다:': 'Cannot read key file:',
    '내보낼 소유 키가 없습니다.': 'No owner keys to export.', '소유 키가 올바르지 않습니다.': 'Invalid owner key.',

    // ── Sign-in
    '승인자 · 관리자 로그인': 'Approver · Admin sign-in', '관리자가 승인자로 등록한 이메일만 로그인할 수 있습니다.': 'Only emails registered as approvers by an admin can sign in.',
    'Google 계정': 'Google account', '이메일 인증 코드': 'Email verification code', '코드 받기': 'Get code', '재발송': 'Resend', '인증 후 로그인': 'Verify & sign in',
    '최고 관리자(비밀번호) 로그인': 'Super admin (password) sign-in', 'Google 로그인 스크립트를 불러오지 못했습니다.': 'Could not load Google sign-in.',
    'Google·이메일 인증이 아직 설정되지 않았습니다. 최고 관리자 비밀번호로 로그인한 뒤 설정 탭의 연동 상태를 확인하세요.': 'Google and email sign-in are not configured yet. Sign in with the super admin password and check Integrations in Settings.',
    'API 서버에 연결할 수 없습니다.': 'Cannot reach the API server.', '관리자 로그인': 'Admin sign-in', 'Google 로그인': 'Google sign-in', '이메일 로그인': 'Email sign-in',
    '인증 코드 요청': 'Request code', '등록된 승인자라면 인증 코드가 발송됩니다. (10분 유효)': 'If the email belongs to a registered approver, a code has been sent (valid 10 min).',
    '비밀번호': 'Password', '이메일 인증': 'Email verification', '이메일 코드': 'Email code', '로그아웃 ': 'Sign out', '까지': 'until',

    // ── Admin console (common)
    '방문 통계': 'Analytics', '승인자 관리': 'Approvers', '감사 로그': 'Audit log', '방문 로그(원본)': 'Visit log (raw)', '패치 / 배포': 'Patch / Deploy', '백업 / 복원': 'Backup / Restore',
    '승인 대기 중': 'Awaiting review', '최근 활동': 'Recent activity', '기록 없음': 'No records', '승인된 앱': 'Approved apps', '피드백 ': 'Feedback',
    '승인자 안내': 'For approvers',
    '승인 대기 앱을 실행해 보고': 'Run pending apps, then', '반려(사유 필수)': 'reject (reason required)',
    '하세요. 모든 결정은 작성자에게 메일로 전달되고 감사 로그에 기록됩니다.': '. Every decision is emailed to the author and recorded in the audit log.',
    '앱 검토 —': 'Review app —', '현재 상태': 'Current status', '등록 · 수정': 'Submitted · Updated', '실행해 보기': 'Try it', '검토 의견': 'Review note',
    '(반려 시 필수 · 작성자에게 전달)': '(required to reject · sent to the author)', '예: 외부 스크립트 출처 확인 필요': 'e.g. Please document the external script sources',
    '이메일 없음(결과 메일 미발송)': 'no email (no result notification)', '반려 사유를 입력하세요.': 'Please enter a rejection reason.',
    '앱 승인': 'Approve app', '앱 반려': 'Reject app', '신규·수정된 앱은 승인 후에만 공개됩니다.': 'New and edited apps are published only after approval.',
    '에서 실행해 보고 승인 또는 반려(사유 필수)하세요. 결정은 작성자 메일·승인 이력·감사 로그에 남습니다.': ' to run it, then approve or reject (reason required). Decisions are emailed to the author and recorded in the review history and audit log.',
    '이름·작성자·이메일 검색': 'Search name, author, email', '전체 상태': 'All statuses', '최종 검토': 'Last review',
    '승인 대기 중인 앱이 없습니다': 'No apps awaiting review', '조건에 맞는 앱이 없습니다': 'No matching apps', '대기 중인 앱이 없습니다.': 'Nothing pending.',
    '추천 지정': 'Feature', '추천 해제': 'Unfeature', '피드백이 없습니다.': 'No feedback.', '피드백 삭제': 'Delete feedback',

    // ── Approvers
    '등록된 이메일만': 'Only registered emails can sign in with', '으로 로그인할 수 있습니다.': '.', '는 앱 승인·반려를,': ' can approve or reject apps;',
    '는 승인자 관리·로그·설정·패치까지 할 수 있습니다.': ' can also manage approvers, logs, settings and patches.',
    '관리자 역할은 최고 관리자만 부여할 수 있습니다.': 'Only the super admin can grant the admin role.',
    '비활성화·삭제하면 기존 로그인 세션도 즉시 끊깁니다.': 'Deactivating or deleting someone ends their sessions immediately.',
    '(인증 수단 미설정 — 설정 탭 확인)': '(no sign-in method configured — see Settings)', 'Google 로그인 또는 이메일 인증 코드': 'Google sign-in or email code',
    '승인자 등록': 'Add approver', '이름 (선택)': 'Name (optional)', '안내 메일 발송': 'Send invitation email', '최근 로그인': 'Last sign-in', '로그인 수': 'Sign-ins',
    '승인자로': 'Make approver', '관리자로': 'Make admin', '이름 변경': 'Rename', '승인자 삭제': 'Delete approver', '승인자 활성화': 'Activate approver',
    '승인자 비활성화': 'Deactivate approver', '승인자 역할 변경': 'Change approver role', '승인자 이름 변경': 'Rename approver',
    '을(를) 삭제합니다. 현재 로그인 세션도 즉시 무효화됩니다.': 'will be deleted and their active sessions revoked immediately.',
    '등록된 승인자가 없습니다. 위에서 이메일을 등록하세요.': 'No approvers yet. Add an email above.',

    // ── Audit log
    '전체 작업': 'All actions', '사용자(이메일)': 'User (email)', '대상·상세 검색': 'Search target / detail', '전체 결과': 'All results',
    '최근 24시간': 'Last 24 hours', '최근 7일': 'Last 7 days', '최근 30일': 'Last 30 days', '조회 ': 'Search', 'CSV 내보내기': 'Export CSV',
    'IP / 국가': 'IP / Country', '기록이 없습니다.': 'No records.', '내보낼 기록이 없습니다.': 'Nothing to export.', '감사 로그 CSV 내보내기': 'Export audit log CSV', '(상세 없음)': '(no detail)',
    '앱 등록 ': 'App submitted', '승인 처리': 'Review decision', '승인 전 미리보기': 'Pre-approval preview', '인증 코드 요청 ': 'Code requested',
    '승인자 변경': 'Approver updated', '설정 변경': 'Settings changed', '패치 커밋': 'Patch commit', '재배포': 'Redeploy', '백업': 'Backup',
    '통계 초기화': 'Reset stats', '방문 로그 삭제': 'Clear visit log', '테스트 메일': 'Test email', '초대 메일': 'Invitation email',
    '작성자 결과 메일': 'Author result email', '승인 요청 메일': 'Review request email',

    // ── Visit log
    '방문 로그 비우기': 'Clear visit log', '로그가 없습니다.': 'No logs.', '방문 로그를 모두 삭제합니다. (감사 로그는 유지)': 'Delete all visit logs? (The audit log is kept.)',

    // ── Settings
    '승인 절차': 'Approval workflow', '자동 승인': 'Auto-approve', '켜면 승인 절차 없이 즉시 공개됩니다. (기본: 끔 — 승인자 승인 필수)': 'When on, apps are published without review. (Default: off — approval required)',
    '승인 요청 메일': 'Review request email', '신규 등록·수정 시 활성 승인자 전원에게 메일 발송': 'Email all active approvers on new or edited submissions',
    '작성자 결과 메일 ': 'Author result email', '승인·반려 시 작성자 이메일로 결과와 사유 발송': 'Email the author the decision and reason',
    '로그 보관 · 공지': 'Log retention · Notice', '감사 로그 보관(일)': 'Audit log retention (days)', '방문 로그 보관(일)': 'Visit log retention (days)', '상단 공지': 'Top notice',
    '비우면 표시하지 않음': 'Leave empty to hide', '연동 상태': 'Integrations', 'API 버전': 'API version', '설정됨': 'Configured', '미설정': 'Not set',
    '비밀번호 로그인': 'Password sign-in', '최고 관리자 비상 로그인': 'Super admin break-glass sign-in', '세션 서명 키': 'Session signing key',
    '없으면 ADMIN_PASSWORD로 서명 (비밀번호 변경 시 전체 세션 만료)': 'Falls back to ADMIN_PASSWORD (changing it signs everyone out)',
    'Google Cloud OAuth 웹 클라이언트 ID': 'Google Cloud OAuth web client ID', '이메일 발송': 'Email sending', '발신:': 'From:',
    'GitHub 패치': 'GitHub patching', 'UI 패치·롤백·재배포에 필요': 'Required for UI patch, rollback and redeploy',
    '시크릿은 GitHub 저장소 Secrets에 등록하면 다음 API 배포(패치 탭 → API 재배포)에 자동 반영됩니다.': 'Secrets added to the GitHub repository are applied on the next API deploy (Patch tab → Redeploy API).',
    '설정을 저장했습니다.': 'Settings saved.', '테스트 메일 발송': 'Send test email', '테스트 메일을 보냈습니다.': 'Test email sent.',
    '수신 이메일 주소를 입력하세요.': 'Enter the recipient email address.',

    // ── Backup
    '백업 다운로드': 'Download backup', '전체 백업': 'Full backup', '다운로드됨': 'Downloaded', '백업 파일 선택': 'Choose backup file', '데이터 복원': 'Restore data',
    '앱·HTML 소스·평점·피드백·승인자·승인 이력·설정을 하나의 JSON으로 내려받습니다. (감사 로그는 감사 로그 탭에서 CSV로 내보내기)': 'Download apps, HTML sources, ratings, feedback, approvers, review history and settings as one JSON file. (Export the audit log as CSV from its tab.)',
    '백업 JSON을 올리면 같은 ID는 덮어쓰고 없는 항목은 추가합니다.': 'Uploading a backup overwrites matching IDs and adds missing items.',
    '모든 앱의 실행 수·평점과 누적 방문 수를 0으로 만듭니다.': 'Resets run counts, ratings and visitor totals for all apps to zero.',
    '실행 수·평점·누적 방문 수를 0으로 초기화합니다. 되돌릴 수 없습니다.': 'Reset runs, ratings and visitor totals to zero? This cannot be undone.',
    ') 파일로 복원합니다. 같은 ID는 덮어씁니다.': ') will be restored. Matching IDs are overwritten.',

    // ── Patch / deploy
    'GitHub 연동이 설정되지 않았습니다.': 'GitHub integration is not configured.', '저장소 Secrets에': 'Add', '웹 배포 버전': 'Web version', 'API 배포 버전': 'API version',
    '최신 반영됨': 'Up to date', 'HEAD와 다름 — 배포 중이거나 web/ 변경 없음': 'Differs from HEAD — deploying, or no web/ changes',
    'HEAD와 다름 — 배포 중이거나 worker/ 변경 없음': 'Differs from HEAD — deploying, or no worker/ changes', 'version.json 없음': 'no version.json',
    '패치 업로드': 'Upload patch', '웹 재배포': 'Redeploy web', 'API 재배포': 'Redeploy API', '패치 zip 또는 개별 파일 선택': 'Choose a patch zip or files', '· 여기로 끌어다 놓기': '· or drag here',
    'zip 내부 경로는 저장소 루트 기준(예:': 'Paths inside the zip are relative to the repo root (e.g.', ') · 최상위 폴더 1개는 자동 제거 ·': ') · a single top folder is stripped ·', '로 삭제 지정': 'lists files to delete',
    '배포 진행 상황': 'Deployment progress', '최근 커밋 · 배포 이력': 'Recent commits · deployments', '배포 (Actions)': 'Deploy (Actions)', '이 버전으로 롤백': 'Roll back to this',
    '비교 결과': 'Comparison', '기준 커밋': 'base', '동일 파일도 표시': 'Show unchanged files', '경로 (저장소 기준 · 수정 가능)': 'Path (from repo root · editable)', '상태 ': 'Status',
    '저장소와 모두 동일합니다. 변경 사항이 없습니다.': 'Everything matches the repository. No changes.',
    '워크플로 파일 변경은 토큰에': 'Changing workflow files requires the token permission',
    'DB 마이그레이션이 포함되어 있습니다. API 배포 시 자동 적용됩니다.': 'Includes a DB migration; it is applied automatically on API deploy.',
    '커밋 메시지 (예: 승인 화면 개선)': 'Commit message (e.g. Improve review screen)', '패치 적용': 'Apply patch',
    '적용하면': 'Applying commits to', '에 커밋되고 변경 영역(web/ → 웹, worker/ → API)의 GitHub Actions 배포가 자동 실행됩니다. 문제가 있으면 아래 이력에서 롤백하세요.': ' and triggers GitHub Actions for the changed areas (web/ → web, worker/ → API). Roll back from the history below if anything goes wrong.',
    '경로가 올바르지 않은 파일이 있습니다.': 'Some files have invalid paths.', '중복된 경로가 있습니다.': 'Duplicate paths found.', '를 커밋하고 배포합니다.': 'will be committed and deployed.',
    '커밋 중…': 'Committing…', '충돌 감지': 'Conflict detected', '그래도 현재 HEAD 위에 이 파일들을 적용할까요?': 'Apply these files on top of the current HEAD anyway?', '강제 적용': 'Force apply',
    '패치 커밋(강제)': 'Patch commit (forced)', '배포 추적': 'Tracking deploy', '화면 이동': 'Navigated away', '워크플로 실패': 'Workflow failed', '배포 완료': 'Deployed',
    '워크플로 없음': 'No workflow', '15분 초과': 'Timed out (15 min)', '워크플로 시작 대기 중…': 'Waiting for workflows to start…',
    '실행된 워크플로가 없습니다 (web/·worker/ 외 파일만 바뀐 경우 정상).': 'No workflows ran (normal if only files outside web/ and worker/ changed).',
    '배포가 실패했습니다. Actions 로그를 확인하거나 이전 버전으로 롤백하세요.': 'Deployment failed. Check the Actions log or roll back to a previous version.',
    '배포 완료.': 'Deployed.', '새로고침해 새 화면 적용': 'Reload to apply', '버전 롤백': 'Roll back version',
    '” 시점의 저장소 상태로 되돌리는 새 커밋을 만들고 자동 배포합니다.': '”: a new commit restoring that repository state will be created and deployed.',
    'DB 데이터(앱·로그)는 되돌리지 않습니다.': 'DB data (apps, logs) is not rolled back.', '롤백 커밋을 만들었습니다. 배포를 추적합니다.': 'Rollback commit created. Tracking deployment.',
    '배포 워크플로를 실행했습니다.': 'Deploy workflow started.', '패치할 파일이 없습니다.': 'No files to patch.', 'patch.json 형식 오류 — 무시합니다.': 'Invalid patch.json — ignored.',
    'zip 해제 모듈을 불러오지 못했습니다.': 'Could not load the unzip module.', '버전': 'Version',
    '(Fine-grained PAT — 이 저장소에 Contents·Actions 읽기/쓰기, Workflows 쓰기)을 등록하고 API 배포 워크플로를 한 번 실행하세요. README의 “UI 패치 설정” 참고.': ' (fine-grained PAT with Contents & Actions read/write and Workflows write on this repo) to the repository secrets, then run the API deploy workflow once. See “UI patch setup” in the README.',

    // ── Analytics
    '30초마다 자동 갱신 ·': 'Auto-refresh every 30s ·', '1년': '1 year', '현재 접속 ': 'Online now', '최근 3분 내 활동': 'Active in the last 3 min', '오늘 페이지뷰': 'Pageviews today',
    '최근 7일 방문자': 'Visitors, last 7 days', '어제와 같음': 'Same as yesterday', '어제 기록 없음': 'No data for yesterday', '방문자(UV)': 'Visitors (UV)', '페이지뷰(PV)': 'Pageviews (PV)',
    '표로 보기': 'Show as table', '방문자': 'Visitors', '페이지뷰': 'Pageviews', '앱 조회': 'App views', '오늘 시간대별 페이지뷰': 'Pageviews by hour (today)', 'KST · 진한 막대 = 현재 시각': 'KST · dark bar = current hour',
    '실시간 접속': 'Live visitors', '재방문': 'Returning', '현재 접속 중인 방문자가 없습니다.': 'No one is online right now.', '인기 페이지': 'Top pages', '인기 앱 (조회 + 실행)': 'Top apps (views + runs)',
    '유입 경로': 'Referrers', '기기 · 브라우저': 'Devices · Browsers', '데이터가 없습니다.': 'No data.', '일별 방문자와 페이지뷰 추이': 'Daily visitors and pageviews', '오늘 시간대별 페이지뷰 ': 'Pageviews by hour',
    '수정': 'Edit', '최근 7일 조회·실행 ': 'Views · runs, last 7 days',

    // ── Additions
    '누적 페이지뷰': 'Total pageviews', '내비게이터': 'Navigator', '썸네일': 'Thumbnail', '저장소 HEAD': 'Repo HEAD', 'UI 패치': 'UI patch',
    '입력 내용을 확인하세요. 등록 후 관리자 승인을 거쳐 공개됩니다.': 'Check your entries. It will be published after approval.',
    '입력 내용을 확인하세요. 수정하면 다시 관리자 승인 대기 상태가 됩니다.': 'Check your entries. Saving changes sends the app back for approval.',
    '는 승인자 관리·로그·설정·패치까지 할 수 있습니다. 비활성화·삭제하면 기존 로그인 세션도 즉시 끊깁니다.': ' can also manage approvers, logs, settings and patches. Deactivating or deleting someone ends their sessions immediately.',
    '는 승인자 관리·로그·설정·패치까지 할 수 있습니다. 관리자 역할은 최고 관리자만 부여할 수 있습니다. 비활성화·삭제하면 기존 로그인 세션도 즉시 끊깁니다.': ' can also manage approvers, logs, settings and patches. Only the super admin can grant the admin role. Deactivating or deleting someone ends their sessions immediately.',
    '최고 관리자 ': 'Super admin',
    '권한이 필요합니다.': '.', 'config.js 의 API_BASE(': 'Check API_BASE in config.js (', ')와 Worker 배포 상태를 확인하세요.': ') and the Worker deployment.',
    '대기': 'Queued', '또는': 'or',
    '데모룸 · HTML 시뮬레이터': 'Demo Room · HTML simulator', '자동 승인 설정': 'Auto-approve setting', 'HTML 소스 변경 포함': 'Includes HTML source change',
    'system(자동 승인)': 'system (auto-approve)', '신규 등록': 'new submission', '수정 후 재승인 요청': 'resubmitted after edit', '건너뜀': 'Skipped', 'Not found': 'Not found', 'sha 가 필요합니다.': 'A commit SHA is required.', 'workflow 는 pages 또는 worker': 'workflow must be pages or worker',

    // ── Server (API) error messages
    '서버 오류가 발생했습니다.': 'A server error occurred.', '앱을 찾을 수 없습니다.': 'App not found.', '승인되지 않은 앱입니다.': 'This app is not approved.',
    'HTML 소스가 없습니다.': 'HTML source not found.', 'HTML 소스를 첨부하세요.': 'Please attach the HTML source.', 'HTML은 10MB 이하만 허용됩니다.': 'HTML must be 10 MB or smaller.',
    'JSON 형식이 올바르지 않습니다.': 'Invalid JSON.', 'https:// 로 시작하는 앱 URL을 입력하세요.': 'Enter an app URL starting with https://.',
    '관리자 권한이 필요합니다.': 'Admin permission required.', '관리자 삭제는 최고 관리자만 할 수 있습니다.': 'Only the super admin can delete admins.',
    '관리자 역할 부여·변경은 최고 관리자만 할 수 있습니다.': 'Only the super admin can grant or change the admin role.',
    '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.': 'Too many sign-in attempts. Try again in 15 minutes.', '로그인이 필요합니다.': 'Sign-in required.',
    '메일 발송에 실패했습니다. RESEND_API_KEY / MAIL_FROM 도메인 인증을 확인하세요.': 'Email failed. Check RESEND_API_KEY and MAIL_FROM domain verification.',
    '반려 사유를 입력하세요. ': 'Please enter a rejection reason.', '백업 파일 형식이 올바르지 않습니다.': 'Invalid backup file.', '변경 사항이 없습니다 (현재 저장소와 동일).': 'No changes (identical to the repository).',
    '변경할 파일이 없습니다.': 'No files to change.', '본인은 삭제할 수 없습니다.': 'You cannot delete yourself.', '본인의 역할·상태는 변경할 수 없습니다.': 'You cannot change your own role or status.',
    '비밀번호 로그인이 설정되지 않았습니다.': 'Password sign-in is not configured.', '비밀번호가 올바르지 않습니다.': 'Incorrect password.', '상태 값이 올바르지 않습니다.': 'Invalid status.',
    '소유 키 또는 관리자 권한이 필요합니다.': 'Owner key or admin permission required.', '소유자 또는 관리자만 소스를 볼 수 있습니다.': 'Only the owner or admins can view the source.',
    '소유자 또는 승인자만 볼 수 있습니다.': 'Only the owner or approvers can view this.', '수신 이메일을 입력하세요.': 'Enter a recipient email.', '승인된 앱만 평가할 수 있습니다.': 'Only approved apps can be rated.',
    '승인자를 찾을 수 없습니다.': 'Approver not found.', '시도 횟수를 초과했습니다. 코드를 다시 요청하세요.': 'Too many attempts. Request a new code.',
    '썸네일은 https:// URL만 허용됩니다.': 'Thumbnail must be an https:// URL.', '앱 유형이 올바르지 않습니다.': 'Invalid app type.', '요청 크기가 너무 큽니다.': 'Request too large.',
    '요청이 너무 많습니다.': 'Too many requests.', '요청이 너무 많습니다. 잠시 후 다시 시도하세요.': 'Too many requests. Please try again shortly.',
    '이 이메일로 너무 자주 요청했습니다. 10분 후 다시 시도하세요.': 'Too many requests for this email. Try again in 10 minutes.',
    '이메일 인증이 설정되지 않았습니다 (RESEND_API_KEY).': 'Email sign-in is not configured (RESEND_API_KEY).', '이메일과 6자리 코드를 입력하세요.': 'Enter your email and the 6-digit code.',
    '이미 등록된 이메일입니다.': 'This email is already registered.', '인증 메일 발송에 실패했습니다. 관리자에게 문의하세요.': 'Could not send the verification email. Contact an admin.',
    '잠시 후 다시 시도하세요.': 'Please try again shortly.', '코드가 만료되었습니다. 다시 요청하세요.': 'The code has expired. Request a new one.', '코드가 올바르지 않습니다.': 'Incorrect code.',
    '평점은 1~5 사이여야 합니다.': 'Rating must be between 1 and 5.', '피드백은 시간당 10건까지 가능합니다.': 'Up to 10 feedback messages per hour.',
    '하루 등록 한도(20건)를 초과했습니다.': 'Daily submission limit (20) exceeded.', '한 번에 최대 400개 파일까지 패치할 수 있습니다.': 'Up to 400 files per patch.',
    '현재 버전과 동일합니다.': 'Identical to the current version.', '롤백할 커밋 sha 가 필요합니다.': 'A commit SHA to roll back to is required.',
    'GitHub 연동이 설정되지 않았습니다 (PATCH_GITHUB_TOKEN 시크릿).': 'GitHub integration is not configured (PATCH_GITHUB_TOKEN secret).',
    'Google 로그인이 설정되지 않았습니다 (GOOGLE_CLIENT_ID).': 'Google sign-in is not configured (GOOGLE_CLIENT_ID).', 'Google 인증에 실패했습니다.': 'Google authentication failed.',
    'Google 인증 정보가 올바르지 않습니다.': 'Invalid Google credential.', 'Google 토큰 형식 오류': 'Malformed Google token', 'Google 서명 키를 찾을 수 없습니다.': 'Google signing key not found.',
    'Google 공개키를 가져오지 못했습니다.': 'Could not fetch Google public keys.', 'SESSION_SECRET 또는 ADMIN_PASSWORD 시크릿이 필요합니다.': 'SESSION_SECRET or ADMIN_PASSWORD secret is required.',
    '바이너리 파일은 한 번에 35개까지 가능합니다 (Workers 무료 플랜 서브요청 한도).': 'Up to 35 binary files per patch (Workers free-plan subrequest limit).',
  };

  // Dynamic string rules (regex → English)
  const RX = [
    [/^([\d,]+)개 항목$/, '$1 items'], [/^([\d,]+)개$/, '$1'], [/^([\d,]+)건$/, '$1'], [/^([\d,]+)명$/, '$1'], [/^([\d,]+)점$/, '$1 stars'], [/^([\d,]+)일$/, '$1 days'],
    [/^([\d,]+)초 전$/, '$1s ago'], [/^([\d,]+)개 파일$/, '$1 files'], [/^([\d,]+)시$/, '$1h'], [/^([\d,]+)명 접속$/, '$1 online'],
    [/^(.+) 앱을 워크스페이스에 추가했습니다\.$/, 'Added $1 to your workspace.'], [/^(.+) 님, 로그인되었습니다\.$/, (m, a) => `Welcome, ${EN[a] || a}.`], [/^(.+) 을\(를\) 등록했습니다\.$/, 'Added $1.'],
    [/^(.+) 파일을 불러왔습니다\.$/, 'Loaded $1.'], [/^([\d,]+)개 키를 가져왔습니다\.$/, 'Imported $1 keys.'], [/^([\d,]+)점으로 평가했습니다\. 감사합니다!$/, 'Rated $1 stars. Thank you!'],
    [/^복원 완료: 앱 ([\d,]+)개, HTML ([\d,]+)개$/, 'Restored: $1 apps, $2 HTML files'], [/^커밋 (\w+) 완료 — 배포를 추적합니다\.$/, 'Committed $1 — tracking deployment.'],
    [/^공유 링크를 복사했습니다: (.+)$/, 'Share link copied: $1'], [/^\(개발 모드 코드: (\d+)\)$/, '(dev mode code: $1)'], [/^(.+)\(개발 모드 코드: (\d+)\)$/, (m, a, c) => `${tr(a.trim()) || a} (dev mode code: ${c})`],
    [/^키 파일을 읽을 수 없습니다: (.+)$/, 'Cannot read key file: $1'], [/^(.+): (승인됨|반려됨|승인 대기)$/, (m, a, s) => `${a}: ${EN[s]}`],
    [/^(.+) 은\(는\) 등록된 승인자가 아닙니다\. 관리자에게 승인자 등록을 요청하세요\.$/, '$1 is not a registered approver. Ask an admin to add you.'],
    [/^저장소가 그 사이 변경되었습니다 \(현재 (\w+)\)\. 새로고침 후 다시 비교하세요\.$/, 'The repository changed in the meantime (now $1). Refresh and compare again.'],
    [/^허용되지 않는 경로: (.+)$/, 'Path not allowed: $1'], [/^GitHub API (\d+): (.*)$/, 'GitHub API $1: $2'],
    [/^▲ ([\d,]+)% vs 어제$/, '▲ $1% vs yesterday'], [/^▼ ([\d,]+)% vs 어제$/, '▼ $1% vs yesterday'],
    [/^일별 추이 · 최근 ([\d,]+)일$/, 'Daily trend · last $1 days'], [/^(.+) \((일|월|화|수|목|금|토)\)$/, (m, d, w) => `${d} (${{ 일: 'Sun', 월: 'Mon', 화: 'Tue', 수: 'Wed', 목: 'Thu', 금: 'Fri', 토: 'Sat' }[w]})`],
    [/^최근 ([\d,]+)건 \(IP 마스킹 · 보관 기간은 설정 탭\)$/, 'Latest $1 (IPs masked · retention in Settings)'],
    [/^([\d,]+)건 표시 · 행을 누르면 상세 · 보관 기간은 설정 탭에서 변경$/, 'Showing $1 · tap a row for details · retention in Settings'],
    [/^패치 적용 \(([\d,]+)개 · (.+)\)$/, 'Apply patch ($1 files · $2)'], [/^새 버전\((\w+)\)이 배포되었습니다\.$/, 'New version ($1) deployed.'],
    [/^커밋 (\w+) · 경과 ([\d,]+)초$/, 'Commit $1 · $2s elapsed'], [/^30초마다 자동 갱신 · (.+)$/, 'Auto-refresh every 30s · $1'],
    [/^현재 ([\d,]+)명$/, '$1 online'], [/^오늘 ([\d,]+)$/, 'Today $1'], [/^전체 ([\d,]+)$/, 'Total $1'],
    [/^신규 ([\d,]+) \/ 재방문 ([\d,]+)$/, 'new $1 / returning $2'], [/^내 평가: ([\d,]+)점 \(다시 누르면 변경\)$/, 'Your rating: $1 (tap again to change)'],
    [/^(\d+):00 ~ (\d+):59$/, '$1:00 – $2:59'], [/^파일 (\d+)개, 삭제 (\d+)개를 커밋하고 배포합니다\.$/, '$1 files and $2 deletions will be committed and deployed.'],
    [/^\/ 5 · ([\d,]+)명$/, '/ 5 · $1 ratings'],
    [/^30일 ([\d,]+)명$/, '30 days: $1'],
    [/^“(.*)” 시점의 저장소 상태로 되돌리는 새 커밋을 만들고 자동 배포합니다\.$/, '“$1”: a new commit restoring that repository state will be created and deployed.'],
    [/^\((.+)\) 파일로 복원합니다\. 같은 ID는 덮어씁니다\.$/, '($1) will be restored. Matching IDs are overwritten.'],
    [/^(승인 대기|반려됨|승인됨) 미리보기$/, (m, st) => `${EN[st]} preview`], [/^관리자 메모: ([\s\S]+)$/, 'Admin note: $1'], [/^발신: (.+)$/, 'From: $1'], [/^앱 검토 — (.+)$/, 'Review app — $1'], [/^미리보기 — (.+)$/, 'Preview — $1'], [/^피드백 — (.+)$/, 'Feedback — $1'],
    [/^일별 추이·누적 수치는 영구 집계입니다\..*보관 기간\(([\d,]+)일, 설정 탭\).*$/, 'Daily trends and totals are kept permanently. Page, referrer, country and device breakdowns are computed within the raw visit-log retention window ($1 days, see Settings). Visitors are counted by an anonymous per-browser ID; bots, crawlers and admin screens are excluded.'],
  ];
  const UNIT = /^(.+?)\s+([\d,]+)$/; // "<label> <number>" form
  const SEP = /( · | \/ | — |: )/;

  function exact(k) {
    if (Object.prototype.hasOwnProperty.call(EN, k)) return EN[k];
    for (const [re, rep] of RX) if (re.test(k)) return k.replace(re, rep);
    const u = k.match(UNIT);
    if (u && Object.prototype.hasOwnProperty.call(EN, u[1])) return `${EN[u[1]]} ${u[2]}`;
    return null;
  }
  function tr(s) {
    const k = s.trim();
    if (!k || !/[가-힣]/.test(k)) return null;
    let v = exact(k);
    const lead = v === null && k.match(/^([·\/—]\s*)(.+)$/); // leading separator, e.g. "/ <label>", "· <label> 3"
    if (lead) { const r = tr(lead[2]); if (r !== null) v = lead[1] + r; }
    if (v === null && SEP.test(k)) {
      const parts = k.split(SEP);
      let changed = false;
      const out = parts.map((p, i) => {
        if (i % 2) return p;
        const pt = p.trim();
        const x = pt && /[가-힣]/.test(pt) ? exact(pt) : null;
        if (x !== null) { changed = true; return p.replace(pt, x); }
        return p;
      });
      if (changed) v = out.join('');
    }
    if (v === null || v === k) return null; // unchanged → do not write back (prevents observer loops)
    return s.replace(k, v);
  }

  // Never translate user content or code areas
  const SKIP = 'script,style,textarea,code,pre,iframe,[data-notr],.mono,.nm,.card h3,.card .desc,.mt b,.objhd h1,.desc-full,.rk-l a,.thumb-init,.keybox';
  function translateTree(root) {
    if (lang !== 'en' || !root) return;
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && root.closest(SKIP)) { if (root.matches('textarea')) fixAttrs(root); return; }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => {
        if (n.nodeType === 1 && n.matches(SKIP)) { if (n.matches('textarea')) fixAttrs(n); return NodeFilter.FILTER_REJECT; }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n = root.nodeType === 1 ? root : w.nextNode();
    while (n) {
      if (n.nodeType === 3) fixText(n);
      else fixAttrs(n);
      n = w.nextNode();
    }
  }
  function fixText(n) {
    if (!/[가-힣]/.test(n.nodeValue) || (n.parentElement && n.parentElement.closest(SKIP))) return;
    const v = tr(n.nodeValue);
    if (v !== null && v !== n.nodeValue) n.nodeValue = v;
  }
  function fixAttrs(el) {
    for (const a of ['placeholder', 'title', 'aria-label']) {
      const val = el.getAttribute && el.getAttribute(a);
      if (val && /[가-힣]/.test(val)) { const v = tr(val); if (v !== null && v !== val) el.setAttribute(a, v); }
    }
  }

  function setLang(l) {
    try { localStorage.setItem(KEY, l); } catch (_) { /* noop */ }
    location.reload();
  }

  window.I18N = {
    lang,
    locale: lang === 'en' ? 'en-US' : 'ko-KR',
    t: (s) => (lang === 'en' ? tr(s) || s : s),
    setLang,
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Header language toggle
    const right = document.querySelector('.hdr-right');
    if (right) {
      const b = document.createElement('button');
      b.className = 'hdr-btn lang-btn';
      b.id = 'langBtn';
      b.setAttribute('data-notr', '');
      b.title = lang === 'en' ? 'Switch to Korean' : 'Switch to English';
      b.textContent = lang === 'en' ? '한국어' : 'EN';
      b.onclick = () => setLang(lang === 'en' ? 'ko' : 'en');
      right.insertBefore(b, document.getElementById('themeBtn'));
    }
    if (lang !== 'en') return;
    translateTree(document.body);
    let burst = 0; let t0 = Date.now();
    const mo = new MutationObserver((muts) => {
      // Safety valve: stop observing if it fires thousands of times per second (loop)
      if (Date.now() - t0 > 1000) { t0 = Date.now(); burst = 0; }
      burst += muts.length;
      if (burst > 20000) { mo.disconnect(); console.warn('[i18n] observer stopped (mutation storm)'); return; }
      for (const m of muts) {
        if (m.type === 'characterData') fixText(m.target);
        else if (m.type === 'attributes') fixAttrs(m.target);
        else m.addedNodes.forEach(translateTree);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  });
})();
