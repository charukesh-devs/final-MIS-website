-- ====================================================================
-- MIS AUDIT & CONTROLS MONITORING - SUPABASE DATABASE SCHEMA
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. REPORTS TABLE (Timeliness & Version Control Tracker)
create table public.reports (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    expected_submission_date timestamp with time zone not null,
    actual_submission_date timestamp with time zone default timezone('utc'::text, now()) not null,
    uploaded_by uuid references auth.users(id),
    uploaded_by_email text not null,
    file_path text not null, -- Path inside the Supabase Storage bucket
    file_size integer not null,
    file_hash text not null, -- For alteration/tamper detection
    version integer default 1 not null,
    status text default 'submitted'::text check (status in ('submitted', 'approved', 'flagged')),
    is_late boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for performance
create index idx_reports_file_hash on public.reports(file_hash);

-- 2. KPI DICTIONARY TABLE (KPI Consistency Checker definition)
create table public.kpi_dictionary (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique,
    description text,
    formula_definition text not null,
    expected_sheet_name text default 'MIS'::text,
    cell_reference text, -- e.g. B12, C14
    materiality_threshold numeric default 2.0 not null, -- % deviation flagged
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. EXCEPTIONS & FLAGS (Aggregated Central Monitor)
create table public.exceptions (
    id uuid default uuid_generate_v4() primary key,
    module text not null check (module in ('reconciliation', 'kpi_consistency', 'formula_integrity', 'manual_override', 'timeliness')),
    severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
    title text not null,
    description text not null,
    meta_data jsonb default '{}'::jsonb, -- Store dynamic parameters (variance %, cell ref, sheet)
    status text default 'open'::text check (status in ('open', 'under_review', 'resolved', 'overridden')),
    assigned_to uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. OVERRIDES & ANNOTATIONS (Manual Override Tracker logs)
create table public.overrides (
    id uuid default uuid_generate_v4() primary key,
    report_id uuid references public.reports(id) on delete cascade,
    sheet_name text not null,
    cell_reference text not null,
    expected_formula text not null,
    actual_static_value text not null,
    explanation text,
    approved_by uuid references auth.users(id),
    approved_by_email text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
alter table public.reports enable row level security;
alter table public.kpi_dictionary enable row level security;
alter table public.exceptions enable row level security;
alter table public.overrides enable row level security;

-- Policies for REPORTS
create policy "Authenticated users can read reports" 
    on public.reports for select 
    to authenticated 
    using (true);

create policy "Authenticated users can insert reports" 
    on public.reports for insert 
    to authenticated 
    with check (true);

create policy "Only owners or admins can update reports" 
    on public.reports for update 
    to authenticated 
    using (true);

-- Policies for KPI_DICTIONARY
create policy "Authenticated users can read KPI definitions" 
    on public.kpi_dictionary for select 
    to authenticated 
    using (true);

create policy "Authenticated users can manage KPI definitions" 
    on public.kpi_dictionary for all 
    to authenticated 
    using (true);

-- Policies for EXCEPTIONS
create policy "Authenticated users can read exceptions" 
    on public.exceptions for select 
    to authenticated 
    using (true);

create policy "Authenticated users can update/resolve exceptions" 
    on public.exceptions for update 
    to authenticated 
    using (true);

-- Policies for OVERRIDES
create policy "Authenticated users can read overrides" 
    on public.overrides for select 
    to authenticated 
    using (true);

create policy "Authenticated users can log overrides" 
    on public.overrides for insert 
    to authenticated 
    with check (true);

-- ====================================================================
-- STORAGE BUCKETS SETUP (Private Buckets)
-- ====================================================================
-- Log in to Supabase Dashboard -> Storage:
-- Create a bucket named "mis-reports"
-- Set Privacy to: PRIVATE (important for sensitive financial sheets)
-- Use the following storage policy or equivalent in Supabase UI:
-- Allow authenticated users SELECT and INSERT on bucket "mis-reports"
