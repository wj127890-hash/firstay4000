export default async function handler(req, res) {
  const AIRBNB_URL = "https://www.airbnb.co.kr/calendar/ical/1449092803394676993.ics?t=ae54c99940fb41e998f0b0b30f34e0ea";
  
  try {
    const response = await fetch(AIRBNB_URL);
    const data = await response.text();
    
    const lines = data.split(/\r?\n/);
    let checkoutDates = [];
    let events = [];
    let currentEvent = {};

    // 1. 모든 예약 이벤트를 분석합니다.
    lines.forEach(line => {
      if (line.startsWith("BEGIN:VEVENT")) currentEvent = {};
      if (line.startsWith("DTSTART")) currentEvent.start = line.match(/\d{8}/)[0];
      if (line.startsWith("DTEND")) currentEvent.end = line.match(/\d{8}/)[0];
      if (line.startsWith("SUMMARY")) currentEvent.summary = line;
      if (line.startsWith("END:VEVENT")) events.push(currentEvent);
    });

    // 2. 24일 예약이 없으면 25일 체크아웃을 띄우지 않도록 실제 데이터만 추출
    events.forEach(event => {
      if (event.start && event.end) {
        const endDay = `${event.end.slice(0,4)}-${event.end.slice(4,6)}-${event.end.slice(6,8)}`;
        checkoutDates.push(endDay);
      }
    });

    const uniqueDates = [...new Set(checkoutDates)];
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(uniqueDates);
  } catch (error) {
    res.status(500).json([]);
  }
}
