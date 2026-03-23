import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AUTH_COOKIE_NAME } from '../../../lib/auth/session';
import { getSql } from '../../../lib/db/client';
import { normalizeEmail } from '../../../lib/db/users';

export async function GET() {
  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const sql = await getSql();
    const clientRows = await sql`
      SELECT id, name, email, phone, notes
      FROM clients 
      WHERE email = ${normalizeEmail(session.email)}
      LIMIT 1
    `;
    
    const client = clientRows[0];
    if (!client) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.json();
    const sql = await getSql();
    const now = new Date().toISOString();

    const clientRows = await sql`
      SELECT id FROM clients 
      WHERE email = ${normalizeEmail(session.email)}
      LIMIT 1
    `;
    
    if (!clientRows.length) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    const clientId = clientRows[0].id;

    await sql`
      UPDATE clients 
      SET
        name = ${formData.name?.trim() || ''},
        email = ${normalizeEmail(formData.email)},
        phone = ${formData.phone || ''},
        updated_at = ${now}
      WHERE id = ${clientId}
    `;

    const updatedRows = await sql`
      SELECT id, name, email, phone, notes, updated_at
      FROM clients 
      WHERE id = ${clientId}
    `;
    
    const updatedClient = updatedRows[0];

    return NextResponse.json({ 
      client: updatedClient,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update profile' 
    }, { status: 500 });
  }
}