-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: condominios (tenant root)
CREATE TABLE condominios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#3E594D',
  cor_secundaria VARCHAR(7) DEFAULT '#A3C168',
  plano VARCHAR(50) DEFAULT 'basico',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: auth profiles (perfis) extending auth.users
CREATE TABLE perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES condominios(id),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'sindico', 'subsindico', 'zelador', 'morador', 'clube_gestor')),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  horario_trabalho VARCHAR(255),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security base properties
-- Todos devem ter RLS habilitado
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Helper to check tenant role
CREATE OR REPLACE FUNCTION auth.get_condominio_id() RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'condominio_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.get_user_role() RETURNS VARCHAR AS $$
  SELECT (auth.jwt() ->> 'role')::VARCHAR;
$$ LANGUAGE SQL STABLE;

-- Tenant Policy pattern: 
-- Apenas usuários pertencentes ao mesmo condomínio_id podem ver registros,
-- exceto super_admin que vê tudo.
CREATE POLICY "Super admin all access" ON condominios
  FOR ALL USING (auth.get_user_role() = 'super_admin');

CREATE POLICY "Condomínio access for tenant" ON condominios
  FOR SELECT USING (auth.get_condominio_id() = id);

-- Trigger for auto updated_at
CREATE OR REPLACE FUNCTION sync_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_perfis_updated_at
BEFORE UPDATE ON perfis
FOR EACH ROW EXECUTE PROCEDURE sync_updated_at();

-- Mais tabelas serão adicionadas na próxima sprint de Core Features.
