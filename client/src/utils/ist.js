export function getISTNow() {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  return new Date(Date.now() + IST_OFFSET);
}

export function getISTDateString(date) {
  const ist = new Date(date.getTime() + 
    date.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, '0');
  const d = String(ist.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentISTWeek() {
  const now = getISTNow();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul',
                  'Aug','Sep','Oct','Nov','Dec'];

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const dateStr = getISTDateString(day);
    const todayStr = getISTDateString(new Date());
    return {
      label: DAY_NAMES[i],
      date: day.getDate(),
      month: MONTHS[day.getMonth()],
      dateStr,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr
    };
  });
}
