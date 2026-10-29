# 우리은하 천체 탐험대

학생이 태블릿/크롬북으로 천체를 탐험하고, 반응(점수·판단·관측 메모)이 **구글 스프레드시트에 실시간으로 쌓이는** 수업용 웹 앱입니다.

## 구조

```
학생 기기 (GitHub Pages: index.html)
   │  POST  기록 전송 (활동 즉시, 실패 시 15초마다 재전송)
   │  GET   모둠원 기록 (20초마다) / 선생님 현황판 (10초마다, PIN)
   ▼
Google Apps Script 웹 앱 (/exec 주소, apps-script/Code.gs)
   ▼
Google 스프레드시트 '탐험기록' 시트
```

| 파일 | 역할 | 어디에 두나 |
|---|---|---|
| `index.html` | 학생·선생님 화면 | GitHub Pages로 공개 |
| `apps-script/Code.gs` | 기록 저장·조회 API | 구글 시트에 연결된 Apps Script |
| `apps-script/appsscript.json` | Apps Script 설정(시간대 등) | Apps Script (clasp 사용 시) |

## 1단계: 구글 시트 + Apps Script 배포

1. 구글 드라이브에서 새 스프레드시트를 만듭니다. (이미 쓰던 시트가 있으면 그대로 사용)
2. **확장 프로그램 > Apps Script** 를 엽니다.
3. `Code.gs` 내용을 모두 지우고 `apps-script/Code.gs` 를 붙여 넣은 뒤 저장합니다.
4. **프로젝트 설정(⚙) > 스크립트 속성 > 스크립트 속성 추가**
   - 속성: `PIN` / 값: 선생님 화면 비밀번호 (예: 4~6자리 숫자)
5. 편집기 위쪽 함수 목록에서 `setup` 을 고르고 **실행** → 권한 승인
   (“확인되지 않은 앱” 화면이 나오면 *고급 > 이동*). 실행 로그에 `PIN 설정됨. 준비 완료!` 가 나오면 성공.
6. **배포 > 새 배포 > 유형: 웹 앱**
   - 다음 사용자 인증 정보로 실행: **나**
   - 액세스 권한이 있는 사용자: **모든 사용자**
7. 나온 **웹 앱 URL(…/exec)** 을 복사합니다.

> 코드를 고친 뒤에는 **배포 > 배포 관리 > 연필 > 버전: 새 버전 > 배포** 로 올리세요. `/exec` 주소가 그대로 유지됩니다. ‘새 배포’를 누르면 주소가 바뀌어 `index.html` 도 고쳐야 합니다.

## 2단계: index.html 설정

`index.html` 의 `CONFIG` 부분만 고칩니다.

```js
GAS_URL: "https://script.google.com/macros/s/…/exec",   // 1단계에서 복사한 주소
CLASSES: ["3-3","3-4", …],                               // 반 목록
TEAMS: 8,                                                 // 모둠 수
STUDENTS: 31                                              // 반별 마지막 번호
```

## 3단계: GitHub에 올리고 GitHub Pages로 공개

1. github.com 에서 **New repository** → 이름 예: `galaxy-explorer`, **Public** 선택 → Create.
2. **uploading an existing file** 을 눌러 이 폴더의 파일(`index.html`, `README.md`, `apps-script` 폴더)을 끌어다 놓고 **Commit changes**.
3. 저장소 **Settings > Pages > Build and deployment**
   - Source: **Deploy from a branch** / Branch: **main**, 폴더 **/(root)** → Save
4. 1~2분 뒤 `https://<GitHub아이디>.github.io/galaxy-explorer/` 주소가 생깁니다. 이 주소를 학생에게 안내합니다(QR 코드 추천).

> 저장소가 공개되어도 괜찮도록 PIN은 코드가 아니라 **스크립트 속성**에 저장합니다. 학생 기록은 구글 시트에만 있고 GitHub에는 올라가지 않습니다.

## 4단계: 실시간 연동 확인

1. 학생 화면에서 반·모둠·번호를 고르고 미션 하나를 완료합니다.
2. 오른쪽 위 표시가 **“선생님께 전송됨 ✓”** 로 바뀌는지 확인합니다.
3. 구글 시트 `탐험기록` 시트에 새 줄이 바로 생기는지 확인합니다.
4. 학생 화면의 **선생님** 버튼 → PIN 입력 → 현황판이 10초마다 자동 갱신되는지 확인합니다.

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| “전송 대기 N건”이 계속 남음 | 배포 액세스가 **모든 사용자**인지, `GAS_URL` 이 `/exec` 로 끝나는지 |
| 선생님 화면 “PIN 미설정” | 스크립트 속성에 `PIN` 을 추가했는지 |
| 코드를 고쳤는데 그대로임 | ‘배포 관리 > 새 버전’으로 다시 배포했는지 |
| 반 이름이 날짜로 보임 | 예전 기록이면 정상(앱이 자동으로 되돌려 표시) |
