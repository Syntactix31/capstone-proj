import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AUTH_COOKIE_NAME } from '../../../../../lib/auth/session.js';
import { findBookingById } from '../../../../../lib/db/bookings.js';  
import { ensureDatabaseSchema } from '../../../../../lib/db/schema.js';
import { getSql } from '../../../../../lib/db/client.js'; 

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    await ensureDatabaseSchema();
    const booking = await findBookingById(id);
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const sql = getSql();
    const clientEmail = await sql`SELECT email FROM clients WHERE id = ${booking.clientId}`;
    
    if (clientEmail[0]?.email !== session.email) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // ❌ MISSING IMPORT: getCalendarClient
    if (booking.googleEventId) {
      try {
        const { getCalendarClient } = await import('../../../../../lib/googleCalendar.js');
        const calendar = await getCalendarClient();
        await calendar.events.delete({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          eventId: booking.googleEventId,
        });
        console.log('Google event cancelled:', booking.googleEventId);
      } catch (calendarError) {
        console.error('Google Calendar delete failed:', calendarError);
        // Continue - DB cancel still works
      }
    }

    await sql`
      UPDATE bookings 
      SET status = 'cancelled', updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('CANCEL ERROR:', err);
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
  }
}
