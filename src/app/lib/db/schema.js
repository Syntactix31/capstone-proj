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
        CREATE TABLE IF NOT EXISTS services (
          id text PRIMARY KEY,
          name text NOT NULL,
          description text NOT NULL DEFAULT '',
          duration_value integer NOT NULL DEFAULT 1,
          duration_unit text NOT NULL DEFAULT 'hours',
          price numeric NOT NULL DEFAULT 0,
          quantity integer NOT NULL DEFAULT 1,
          active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;

      await sql`
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT ''
      `;

      await sql`
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS duration_value integer NOT NULL DEFAULT 1
      `;

      await sql`
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS duration_unit text NOT NULL DEFAULT 'hours'
      `;

      await sql`
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0
      `;

      await sql`
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1
      `;

      await sql`
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id text PRIMARY KEY,
          client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          service text NOT NULL,
          address text NOT NULL DEFAULT '',
          payment_status text NOT NULL DEFAULT 'Unpaid',
          start_date date,
          estimated_completion_date date,
          completion_date date,
          total_cost numeric NOT NULL DEFAULT 0,
          services_included text NOT NULL DEFAULT '[]',
          payments text NOT NULL DEFAULT '[]',
          quote_data text NOT NULL DEFAULT '{}',
          owner_notes text NOT NULL DEFAULT '',
          estimate_pdf_url text,
          estimate_pdf_name text,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS start_date date
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS estimated_completion_date date
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS completion_date date
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS total_cost numeric NOT NULL DEFAULT 0
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS services_included text NOT NULL DEFAULT '[]'
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS payments text NOT NULL DEFAULT '[]'
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS quote_data text NOT NULL DEFAULT '{}'
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS owner_notes text NOT NULL DEFAULT ''
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS estimate_pdf_url text
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS estimate_pdf_name text
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS quote_signed_at timestamptz
      `;

      await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS quote_signer_name text NOT NULL DEFAULT ''
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS projects_client_service_address_idx
        ON projects (client_id, service, address)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS bookings (
          id text PRIMARY KEY,
          client_id text NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
          project_id text REFERENCES projects(id) ON DELETE SET NULL,
          property_id text REFERENCES client_properties(id) ON DELETE SET NULL,
          service text NOT NULL,
          visit_type text NOT NULL DEFAULT 'Estimate',
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
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS project_id text REFERENCES projects(id) ON DELETE SET NULL
      `;

      await sql`
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS visit_type text NOT NULL DEFAULT 'Estimate'
      `;

      await sql`
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS project_sync_disabled boolean NOT NULL DEFAULT false
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS bookings_status_start_at_idx
        ON bookings (status, start_at)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS estimates (
          id text PRIMARY KEY,
          client_id text REFERENCES clients(id) ON DELETE RESTRICT,
          title text NOT NULL,
          service text NOT NULL,
          price numeric NOT NULL,
          status text NOT NULL DEFAULT 'Pending',
          notes text NOT NULL DEFAULT '',
          recipient_name text NOT NULL DEFAULT '',
          recipient_address text NOT NULL DEFAULT '',
          recipient_email text NOT NULL DEFAULT '',
          recipient_phone text NOT NULL DEFAULT '',
          services_included text NOT NULL DEFAULT '[]',
          quote_data text NOT NULL DEFAULT '{}',
          pdf_url text,
          pdf_name text,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `;      

      await sql`
        ALTER TABLE estimates
        ALTER COLUMN client_id DROP NOT NULL
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS recipient_name text NOT NULL DEFAULT ''
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS recipient_address text NOT NULL DEFAULT ''
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS recipient_email text NOT NULL DEFAULT ''
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS recipient_phone text NOT NULL DEFAULT ''
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS services_included text NOT NULL DEFAULT '[]'
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS quote_data text NOT NULL DEFAULT '{}'
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS pdf_url text
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS pdf_name text
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS quote_requested_at timestamptz
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS quote_converted_at timestamptz
      `;

      await sql`
        ALTER TABLE estimates
        ADD COLUMN IF NOT EXISTS converted_project_id text REFERENCES projects(id) ON DELETE SET NULL
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS admin_activity_logs (
          id text PRIMARY KEY,
          admin_user_id text REFERENCES users(id) ON DELETE SET NULL,
          admin_name text NOT NULL DEFAULT '',
          admin_email text NOT NULL DEFAULT '',
          action text NOT NULL,
          details text NOT NULL DEFAULT '',
          metadata text NOT NULL DEFAULT '{}',
          created_at timestamptz NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS admin_activity_logs_created_at_idx
        ON admin_activity_logs (created_at DESC)
      `;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}
