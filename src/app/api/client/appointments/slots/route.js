import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AUTH_COOKIE_NAME } from '../../../../lib/auth/session.js';
import { listBusyIntervalsForDate } from '../../../../lib/db/bookings.js';
import { ensureDatabaseSchema } from '../../../../lib/db/schema.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 });
    }

    await ensureDatabaseSchema();
    const busy = await listBusyIntervalsForDate(date);

    const slots = [];
    const startHour = 8, endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
        const slotStart = new Date(`${date}T${time24}:00-06:00`);
        const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
        
        const isBusy = busy.some(interval => 
          slotStart < new Date(interval.end) && slotEnd > new Date(interval.start)
        );
        
        if (!isBusy) {
          const [hourStr, minuteStr] = time24.split(':');
          const hour = parseInt(hourStr);
          const h12 = hour % 12 || 12;
          const period = hour >= 12 ? 'PM' : 'AM';
          const time12 = `${h12}:${minuteStr} ${period}`;
          slots.push(time12);
        }
      }
    }

    return NextResponse.json({ slots });
  } catch (err) {
    console.error('SLOTS ERROR:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
