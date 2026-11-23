-- BEV Navigator – STEP 1 of the database handoff (20.11.2026)
-- Run ONCE in Supabase → project of the n8n credential "Supabase Zurich BEV Navigator" → SQL Editor → New query → paste all → Run.
-- It only CREATES 8 new tables whose names start with r12_ . It does not change or delete any existing table.
-- Safe to run twice ("if not exists").

create table if not exists r12_postcode_municipality (postcode text not null, municipality_id int not null, municipality_name text, canton text, primary key (postcode, municipality_id));
create table if not exists r12_el_tariff_h4 (tariff_year int, municipality_id int, municipality_name text, canton text, operator_name text, total_rp_kwh numeric, energy_rp_kwh numeric, network_rp_kwh numeric, levies_rp_kwh numeric, aidfee_rp_kwh numeric, metering_chf_year numeric);
create index if not exists r12_el_tariff_h4_mun on r12_el_tariff_h4 (municipality_id, tariff_year);

create table if not exists r12_ev_programmes (programme_id text primary key, topic_tags text, audiences text, provider_de text, provider_fr text, provider_it text, name_de text, name_fr text, name_it text, description_de text, description_fr text, description_it text, url text, directory_url text, status text, snapshot_on date);
create table if not exists r12_programme_postcodes (programme_id text not null, postcode text not null, primary key (programme_id, postcode));
create index if not exists r12_programme_postcodes_pc on r12_programme_postcodes (postcode);

create table if not exists r12_b2_tariff_energy (tariff_key text primary key, party_id text, energy_chf_kwh_min_incl_vat numeric, energy_chf_kwh_max_incl_vat numeric, has_time_fee int, has_flat_fee int);
create table if not exists r12_b2_station_tariffs (evse_uid text, operator text, postal_code text, current text, power_kw numeric, tariff_key text);
create index if not exists r12_b2_station_tariffs_evse on r12_b2_station_tariffs (evse_uid);

create table if not exists r12_vehicle_tax_examples (canton text, vehicle_label text, powertrain text, engine_cc numeric, power_kw numeric, gross_weight_kg numeric, co2_wltp_g_km numeric, energy_category text, annual_chf numeric, reference_date text, limitation text);
create table if not exists r12_lca_electricity_factors (factor_id text primary key, label text, g_co2eq_per_kwh numeric, source text);

-- read-only access policy on the NEW tables only (n8n uses the database user of the credential; this does not affect it)
do $$ declare t text; begin
  foreach t in array array['r12_postcode_municipality','r12_el_tariff_h4','r12_ev_programmes','r12_programme_postcodes','r12_b2_tariff_energy','r12_b2_station_tariffs','r12_vehicle_tax_examples','r12_lca_electricity_factors'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists read_all on %I', t);
    execute format('create policy read_all on %I for select using (true)', t);
  end loop; end $$;
