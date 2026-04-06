import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AUTH_COOKIE_NAME } from '../../../lib/auth/session.js';
import {
  listBookings,
  createBooking,
} from '../../../lib/db/bookings.js';
import { ensureDatabaseSchema } from '../../../lib/db/schema.js';
import { getSql } from '../../../lib/db/client.js';

function formatEdmontonParts(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };

  const date = d.toLocaleDateString("en-CA", { timeZone: "America/Edmonton" });
  const time = d
    .toLocaleTimeString("en-CA", {
      timeZone: "America/Edmonton",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace("a.m.", "AM")
    .replace("p.m.", "PM")
    .replace("am", "AM")
    .replace("pm", "PM");

  return { date, time };
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    
    console.log('SESSION:', { sub: session?.sub, email: session?.email });
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDatabaseSchema();
    
    const sql = getSql();
    const clientBookingsRaw = await sql`
      SELECT 
        b.*,
        c.name AS client_name, 
        c.email AS client_email,
        p.address
      FROM bookings b
      JOIN clients c ON c.id = b.client_id
      LEFT JOIN client_properties p ON p.id = b.property_id
      WHERE c.email = ${session.email}
      ORDER BY b.start_at ASC
    `;
    
    const clientBookings = clientBookingsRaw.map(row => ({
      id: row.id,
      clientId: row.client_id,
      projectId: row.project_id,
      propertyId: row.property_id,
      eventId: row.google_event_id,
      googleEventId: row.google_event_id,
      client: row.client_name,
      firstName: row.client_name?.split(" ")?.[0] || "",
      email: row.client_email,
      service: row.service,
      visitType: row.visit_type || "Estimate",
      date: formatEdmontonParts(row.start_at).date,
      time: formatEdmontonParts(row.start_at).time,
      address: row.address || "",
      notes: row.notes || "",
      status: row.status === "cancelled" ? "Canceled" : "Confirmed",
    }));
    
    console.log('CLIENT BOOKINGS:', clientBookings.length);
    
    return NextResponse.json({ appointments: clientBookings });
  } catch (err) {
    console.error('CLIENT APPOINTMENTS ERROR:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload.date || !payload.time || !payload.service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await ensureDatabaseSchema();
    const sql = getSql();

    let clientId = session.sub;
    const existingClient = await sql`
      SELECT id FROM clients 
      WHERE email = ${session.email}
    `;
    
    if (existingClient.length > 0) {
      clientId = existingClient[0].id; 
      console.log('Using existing client:', clientId);
    } else {
      console.log('Creating new client:', session.sub);
      await sql`
        INSERT INTO clients (id, email, name, created_at, updated_at)
        VALUES (${session.sub}, ${session.email}, ${session.name || 'Client'}, ${new Date().toISOString()}, ${new Date().toISOString()})
      `;
    }

    // Time conversion
    let [hours, minutes, period] = payload.time.match(/(\d+):(\d+)\s*(AM|PM)/i)?.slice(1) || [];
    let hh = parseInt(hours || 9);
    if (period?.toUpperCase() === 'PM' && hh !== 12) hh += 12;
    if (period?.toUpperCase() === 'AM' && hh === 12) hh = 0;
    const time24h = `${hh.toString().padStart(2, '0')}:${minutes || '00'}`;

    const startDateTime = new Date(`${payload.date}T${time24h}:00-06:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const booking = await createBooking({
      clientId: clientId, 
      service: payload.service,
      visitType: payload.visitType || 'Estimate',
      status: 'confirmed',
      bookingDate: payload.date,
      bookingTime: time24h,
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      notes: payload.notes || ''
    });

    return NextResponse.json(booking);
  } catch (err) {
    console.error('CREATE CLIENT BOOKING ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

