-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create candidates table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create communities table
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    latitude DECIMAL,
    longitude DECIMAL,
    geometry JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vote_records table
CREATE TABLE vote_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    votes INTEGER NOT NULL CHECK (votes >= 0),
    recorded_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_vote_records_community_id ON vote_records(community_id);
CREATE INDEX idx_vote_records_candidate_id ON vote_records(candidate_id);
CREATE INDEX idx_vote_records_recorded_at ON vote_records(recorded_at);

-- Row Level Security (RLS) configuration

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Candidates Policies
CREATE POLICY "Enable read access for authenticated users" ON candidates
    FOR SELECT TO authenticated USING (true);

-- Communities Policies
CREATE POLICY "Enable read access for authenticated users" ON communities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON communities
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON communities
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Vote Records Policies
CREATE POLICY "Enable read access for authenticated users" ON vote_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON vote_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON vote_records
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Audit Logs Policies
CREATE POLICY "Enable read access for authenticated users" ON audit_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Seed Initial Data
INSERT INTO candidates (name, position) VALUES 
('Roberto Carlos', 'Deputado Estadual'),
('Vitor Bomfim', 'Deputado Federal');

INSERT INTO communities (name, latitude, longitude) VALUES
('Santana', -11.5350, -38.5200),
('Mimoso', -11.7100, -38.5650),
('Papagaio', -11.6200, -38.6800),
('Araças', -11.4700, -38.6200),
('Bela Vista', -11.6300, -38.4600);
