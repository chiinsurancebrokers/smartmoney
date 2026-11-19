-- Forward-compatible SaaS schema. The private beta works without a database.
create table if not exists flow_uploads (
  id bigserial primary key, filename text not null, uploaded_at timestamptz not null default now(), raw_row_count integer not null, engine_version text not null
);
create table if not exists signal_snapshots (
  id bigserial primary key, upload_id bigint references flow_uploads(id), symbol text not null, asset_type text not null,
  signal_at timestamptz not null default now(), bias text not null, smart_money_score integer not null,
  confidence integer not null, coverage integer not null, gamma_context text not null, payload jsonb not null
);
create index if not exists signal_snapshots_symbol_time_idx on signal_snapshots(symbol, signal_at desc);

-- Future persistence for the Big Move Detector. The private beta currently stores scan history in localStorage.
create table if not exists big_move_scans (
  id bigserial primary key,
  scanned_at timestamptz not null default now(),
  source text not null default 'twelvedata',
  payload jsonb not null
);
create table if not exists big_move_candidates (
  id bigserial primary key,
  scan_id bigint references big_move_scans(id) on delete cascade,
  symbol text not null,
  setup_score integer not null,
  setup_quality integer not null,
  status text not null,
  close numeric,
  distance_history_low_pct numeric,
  drawdown_history_high_pct numeric,
  reversal_score integer,
  flow_score integer,
  payload jsonb not null
);
create index if not exists big_move_candidates_symbol_scan_idx on big_move_candidates(symbol, scan_id desc);


-- v1.5 Trend & Strategy Intelligence
create table if not exists investment_theses (
  id bigserial primary key,
  symbol text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'ACTIVE',
  direction text not null,
  horizon text,
  entry_price numeric,
  trigger_text text,
  thesis_text text not null,
  invalidation_text text,
  target_zone text,
  notes text,
  snapshot_id bigint references signal_snapshots(id) on delete set null,
  closed_at timestamptz,
  close_note text
);
create index if not exists investment_theses_symbol_status_idx on investment_theses(symbol,status,created_at desc);

create table if not exists signal_outcomes (
  snapshot_id bigint primary key references signal_snapshots(id) on delete cascade,
  symbol text not null,
  signal_at timestamptz not null,
  entry_price numeric,
  horizons jsonb not null default '{}'::jsonb,
  refreshed_at timestamptz not null default now()
);
create index if not exists signal_outcomes_symbol_idx on signal_outcomes(symbol,signal_at desc);

create table if not exists market_regime_snapshots (
  id bigserial primary key,
  captured_at timestamptz not null default now(),
  regime text not null,
  score integer not null default 0,
  payload jsonb not null default '{}'::jsonb
);
create index if not exists market_regime_time_idx on market_regime_snapshots(captured_at desc);
