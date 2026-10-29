/**
 * 우리은하 천체 탐험대 - 기록 수집용 Apps Script
 * 1) 구글 시트 > 확장 프로그램 > Apps Script 에 이 코드를 붙여 넣기
 * 2) 프로젝트 설정(톱니바퀴) > 스크립트 속성 > 속성 추가: 이름 PIN, 값 원하는 번호
 *    (PIN을 코드에 쓰지 않으므로 GitHub에 올려도 비밀번호가 드러나지 않아요)
 * 3) 배포 > 배포 관리 > 연필(수정) > 버전: 새 버전 > 배포
 *    (이렇게 하면 /exec 주소가 바뀌지 않아요. '새 배포'를 누르면 주소가 바뀌어요)
 */
const SHEET = '탐험기록';
const HEAD = ['시각', '반', '모둠', '종류', '천체', '점수', '학생판단', '관측메모', '걸린시간(초)', '상세', 'uid', '번호'];

// 선생님 화면 비밀번호: 스크립트 속성 'PIN'에서 읽음
function pin_() {
  return String(PropertiesService.getScriptProperties().getProperty('PIN') || '').trim();
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) {
    s = ss.insertSheet(SHEET);
    s.appendRow(HEAD);
    s.setFrozenRows(1);
  } else if (s.getLastColumn() < HEAD.length) {
    s.getRange(1, 1, 1, HEAD.length).setValues([HEAD]);
  }
  return s;
}

// 편집기에서 한 번 실행: 시트 준비 + 권한 승인 + PIN 설정 여부 확인
function setup() {
  sheet_();
  Logger.log(pin_() ? 'PIN 설정됨. 준비 완료!' : '스크립트 속성에 PIN을 추가해 주세요.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = JSON.parse(e.postData.contents);
    const items = Array.isArray(data) ? data : [data];
    const s = sheet_();
    const rows = items.map(function (x) {
      return [
        new Date(x.ts || Date.now()),
        String(x.cls || ''),
        String(x.team || ''),
        String(x.kind || ''),
        String(x.id || ''),
        x.points === undefined ? '' : x.points,
        String(x.guess || ''),
        String(x.memo || '').slice(0, 300),
        x.secs === undefined ? '' : x.secs,
        JSON.stringify(x.extra || {}),
        String(x.uid || ''),
        String(x.num || '')
      ];
    });
    if (rows.length) {
      const range = s.getRange(s.getLastRow() + 1, 1, rows.length, HEAD.length);
      // 반 이름 "2-3"이 날짜(2월 3일)로 바뀌지 않도록 글자 형식으로 저장
      range.setNumberFormat('@');
      s.getRange(range.getRow(), 1, rows.length, 1).setNumberFormat('yyyy-MM-dd HH:mm:ss');
      range.setValues(rows);
    }
    return out_({ ok: true, n: rows.length });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 예전에 날짜로 바뀌어 저장된 반 이름을 "2-3" 모양으로 되돌림
function cls_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return (v.getMonth() + 1) + '-' + v.getDate();
  return String(v).trim();
}

function doGet(e) {
  const p = e.parameter || {};
  const tz = 'Asia/Seoul';
  const values = sheet_().getDataRange().getValues();
  values.shift();
  const sameDay = function (r) {
    return !p.day || Utilities.formatDate(new Date(r[0]), tz, 'yyyy-MM-dd') === p.day;
  };

  // 학생용: 같은 반·같은 모둠의 오늘 미션 기록만 (PIN 필요 없음)
  if (p.mode === 'team') {
    const rows = values
      .filter(function (r) {
        return sameDay(r) && cls_(r[1]) === String(p.cls) && String(r[2]).trim() === String(p.team) && r[3] === 'mission';
      })
      .map(function (r) {
        return { ts: new Date(r[0]).getTime(), num: String(r[11]).trim(), kind: r[3], id: r[4], points: r[5], memo: r[7] };
      });
    return out_({ ok: true, rows: rows });
  }

  // 선생님용: PIN 확인 후 전체 기록
  const PIN = pin_();
  if (!PIN) return out_({ ok: false, error: 'PIN 미설정 (Apps Script 프로젝트 설정 > 스크립트 속성에 PIN 추가)' });
  if (String(p.pin || '') !== PIN) return out_({ ok: false, error: 'pin' });
  const rows = values.filter(sameDay).map(function (r) {
    return {
      ts: new Date(r[0]).getTime(), cls: cls_(r[1]), team: String(r[2]).trim(), kind: r[3], id: r[4],
      points: r[5], guess: r[6], memo: r[7], secs: r[8], extra: r[9], uid: r[10], num: String(r[11]).trim()
    };
  });
  return out_({ ok: true, rows: rows });
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
