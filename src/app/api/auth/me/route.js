
// Old code keep as reference (file is dependent)
// import { NextResponse } from "next/server";
// import { getRequestUser } from "../../../lib/auth/server";

// // Return the currently logged-in user so client components can react to auth state.
// export async function GET(req) {
//   const user = getRequestUser(req);
//   if (!user) return NextResponse.json({ user: null }, { status: 200 });
//   return NextResponse.json({ user }, { status: 200 });
// }

// export const runtime = "nodejs";



import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/auth/server";
import { getSql } from "../../../lib/db/client";
import { normalizeEmail } from "../../../lib/db/users";

export async function GET(req) {
  try {
    const user = getRequestUser(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // prioritizing clients table (where settings updates go)
    const sql = await getSql();
    const clientRows = await sql`
      SELECT name, email 
      FROM clients 
      WHERE email = ${normalizeEmail(user.email)}
      LIMIT 1
    `;
    
    const client = clientRows[0];
    
    // Use client.name if exists fallback to users.name
    const finalUser = {
      ...user,
      name: client?.name || user.name,
      email: client?.email || user.email
    };

    return NextResponse.json({ user: finalUser }, { status: 200 });
  } catch (error) {
    console.error("Auth/me error:", error);
    // Fallback to original behavior for unregistered users
    const user = getRequestUser(req);
    return user 
      ? NextResponse.json({ user }, { status: 200 })
      : NextResponse.json({ user: null }, { status: 200 });
  }
}

export const runtime = "nodejs";






//  ====== Potential db fetch stale cache fix (doesn't work lol)
// app/api/auth/me/route.js
// export async function GET(req) {
//   const user = getRequestUser(req);
//   if (!user) return NextResponse.json({ user: null });

//   try {
//     // PRIORITIZE clients.name over users.name
//     const sql = await getSql();
//     const clientRows = await sql`
//       SELECT name FROM clients 
//       WHERE email = ${user.email} 
//       LIMIT 1
//     `;
    
//     return NextResponse.json({ 
//       user: { 
//         ...user, 
//         name: clientRows[0]?.name || user.name  // Latest from clients table
//       } 
//     });
//   } catch (error) {
//     return NextResponse.json({ user }); // Fallback to original
//   }
// }
