import { getSql } from "./client.js";

let schemaPromise = null;

// Make sure the required tables/indexes exist before the app uses the DB.
//Revise time data to not use local machine units
export async function ensureDatabaseSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id text PRIMARY KEY,
          email text NOT NULL UNIQUE,
          name text NOT NULL,
          role text NOT NULL DEFAULT 'client',
          password_hash text,
          provider text NOT NULL DEFAULT 'local',
          picture text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS clients (
          id text PRIMARY KEY,
          email text NOT NULL UNIQUE,
          name text NOT NULL,
          phone text NOT NULL DEFAULT '',
          notes text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS client_properties (
          id text PRIMARY KEY,
          client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          address text NOT NULL,
          city text NOT NULL DEFAULT 'Calgary',
          province text NOT NULL DEFAULT 'Alberta',
          postal text NOT NULL DEFAULT '',
          property_type text NOT NULL DEFAULT 'House',
          additional_instructions text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS client_properties_client_address_idx
        ON client_properties (client_id, address)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS bookings (
          id text PRIMARY KEY,
          client_id text NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
          property_id text REFERENCES client_properties(id) ON DELETE SET NULL,
          service text NOT NULL,
          status text NOT NULL DEFAULT 'confirmed',
          booking_date date NOT NULL,
          booking_time text NOT NULL,
          start_at timestamptz NOT NULL,
          end_at timestamptz NOT NULL,
          notes text NOT NULL DEFAULT '',
          google_event_id text UNIQUE,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS bookings_status_start_at_idx
        ON bookings (status, start_at)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS estimates (
          id text PRIMARY KEY,
          client_id text NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
          title text NOT NULL,
          service text NOT NULL,
          price numeric NOT NULL,
          status text NOT NULL DEFAULT 'Pending',
          notes text NOT NULL DEFAULT '',
          pdf_url text,
          pdf_name text,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;      
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}