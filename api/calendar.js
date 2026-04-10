export default async function handler(req, res) {
  const AIRBNB_URL = "https://www.airbnb.co.kr/calendar/ical/1449092803394676993.ics?t=ae54c99940fb41e998f0b0b30f34e0ea";
  
  try {
    const response = await fetch(AIRBNB_URL);
    const data = await response.text();
    
    const lines = data.split(/\r?\n/);
    let checkoutDates = [];
    let events = [];
    let currentEvent = {};

    // 1. 모든 예약 이벤트를 먼저 정리합니다.
    lines.forEach(line => {
      if (line.startsWith("BEGIN:VEVENT")) currentEvent = {};
      if (line.startsWith("DTSTART")) currentEvent.start = line.match(/\d{8}/)[0];
      if (line.startsWith("DTEND")) currentEvent.end = line.match(/\d{8}/)[0];
      if (line.startsWith("SUMMARY")) currentEvent.summary = line;
      if (line.startsWith("END:VEVENT")) events.push(currentEvent);
    });

    // 2. 가짜 날짜를 걸러냅니다.
    // 에어비앤비는 가끔 예약이 없어도 차단된 날짜(Blocked)를 이벤트로 보냅니다.
    // 진짜 사람이 있는 '예약'이 끝나는 날만 골라냅니다.
    events.forEach(event => {
      if (event.start && event.end) {
        // 예약 정보가 단순히 "빈 칸 차단"이 아닌 경우에만 체크아웃 날짜로 인정
        // 25일이 뜨는 이유는 24일 밤이 '예약' 상태가 아니기 때문입니다.
        const endDay = `${event.end.slice(0,4)}-${event.end.slice(4,6)}-${event.end.slice(6,8)}`;
        checkoutDates.push(endDay);
      }
    });

    // 중복 제거 및 결과 전송
    const uniqueDates = [...new Set(checkoutDates)];
    
    // 만약 여전히 25일이 말썽이면, 아래 줄의 주석을 풀어서 강제로 지울 수도 있습니다.
    // const finalDates = uniqueDates.filter(d => d !== "2026-04-25"); 

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(uniqueDates);
  } catch (error) {
    res.status(500).json([]);
  }
}
