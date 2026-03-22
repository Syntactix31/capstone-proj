import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AUTH_COOKIE_NAME } from '../../../lib/auth/session';
import { fetchClientJoinedByEmail, updateClient } from '../../../lib/db/clients';

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

    const client = await fetchClientJoinedByEmail(session.email);
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
        
    const formData = await request.json();    
    const client = await fetchClientJoinedByEmail(session.email);
    
    const normalizedEmail = formData.email.toLowerCase().trim();
    const patchData = {
      name: formData.name?.trim(),
      email: normalizedEmail,
      phone: formData.phone || ''
    };
    
    const updatedClient = await updateClient(client.id, patchData);
    const freshClient = await fetchClientJoinedByEmail(normalizedEmail);
    
    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error('FULL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}