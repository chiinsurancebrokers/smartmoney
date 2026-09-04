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
