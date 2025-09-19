-- Create sync log table to track QuickBooks synchronization activities
CREATE TABLE IF NOT EXISTS qb_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Session Information
    session_id VARCHAR(100), -- QuickBooks Web Connector session ticket
    session_start TIMESTAMPTZ,
    session_end TIMESTAMPTZ,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'authentication', 'connection_error', 'send_request', 'receive_response', 
        'data_sync', 'close_connection', 'error', 'warning', 'info'
    )),
    event_subtype VARCHAR(50), -- More specific categorization
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
    
    -- Request/Response Information
    soap_action VARCHAR(50), -- SOAP action name
    qb_request_type VARCHAR(50), -- ItemQuery, CustomerQuery, etc.
    qb_company_file VARCHAR(500), -- QB company file being synced
    
    -- Data Processing
    records_requested INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Error Information
    error_code VARCHAR(50),
    error_message TEXT,
    error_details JSONB,
    
    -- Performance Metrics
    processing_time_ms INTEGER, -- Time taken in milliseconds
    request_size_bytes INTEGER, -- Size of request data
    response_size_bytes INTEGER, -- Size of response data
    
    -- Additional Information
    message TEXT, -- Human readable message
    metadata JSONB DEFAULT '{}', -- Additional structured data
    
    -- IP and User Information
    client_ip INET,
    user_agent TEXT,
    qb_version VARCHAR(50), -- QuickBooks version
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sync statistics table for aggregated metrics
CREATE TABLE IF NOT EXISTS qb_sync_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Time Period
    sync_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sync_hour INTEGER, -- For hourly stats (0-23)
    period_type VARCHAR(20) DEFAULT 'daily' CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    
    -- Sync Counts
    total_syncs INTEGER DEFAULT 0,
    successful_syncs INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0,
    
    -- Data Counts by Type
    companies_synced INTEGER DEFAULT 0,
    customers_synced INTEGER DEFAULT 0,
    items_synced INTEGER DEFAULT 0,
    sales_synced INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_processing_time_ms INTEGER,
    total_processing_time_ms BIGINT DEFAULT 0,
    total_records_processed INTEGER DEFAULT 0,
    
    -- Error Summary
    common_errors JSONB DEFAULT '{}', -- JSON object with error counts
    
    -- Last Update
    last_sync_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_log_company_id ON qb_sync_log(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_session_id ON qb_sync_log(session_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_event_type ON qb_sync_log(event_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON qb_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON qb_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_log_soap_action ON qb_sync_log(soap_action);

CREATE INDEX IF NOT EXISTS idx_sync_stats_company_id ON qb_sync_statistics(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_stats_date ON qb_sync_statistics(sync_date);
CREATE INDEX IF NOT EXISTS idx_sync_stats_period_type ON qb_sync_statistics(period_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sync_log_company_session ON qb_sync_log(company_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_type_status ON qb_sync_log(event_type, status);
CREATE INDEX IF NOT EXISTS idx_sync_stats_company_date ON qb_sync_statistics(company_id, sync_date);

-- Add updated_at trigger for sync statistics
CREATE TRIGGER update_sync_statistics_updated_at 
    BEFORE UPDATE ON qb_sync_statistics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE qb_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE qb_sync_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON qb_sync_log
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write access" ON qb_sync_log
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON qb_sync_statistics
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write access" ON qb_sync_statistics
    FOR ALL TO authenticated USING (true);

-- Create useful views
CREATE VIEW recent_sync_activity AS
SELECT 
    sl.*,
    c.name as company_name,
    ROW_NUMBER() OVER (PARTITION BY sl.company_id ORDER BY sl.created_at DESC) as rn
FROM qb_sync_log sl
LEFT JOIN companies c ON sl.company_id = c.id
WHERE sl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sl.created_at DESC;

CREATE VIEW sync_error_summary AS
SELECT 
    company_id,
    c.name as company_name,
    event_type,
    error_code,
    error_message,
    COUNT(*) as error_count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM qb_sync_log sl
LEFT JOIN companies c ON sl.company_id = c.id
WHERE status = 'error' 
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY company_id, c.name, event_type, error_code, error_message
ORDER BY error_count DESC, last_occurrence DESC;

CREATE VIEW sync_performance_summary AS
SELECT 
    company_id,
    c.name as company_name,
    DATE(created_at) as sync_date,
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE status = 'success') as successful_operations,
    COUNT(*) FILTER (WHERE status = 'error') as failed_operations,
    AVG(processing_time_ms) as avg_processing_time,
    SUM(records_processed) as total_records_processed,
    MIN(created_at) as first_sync,
    MAX(created_at) as last_sync
FROM qb_sync_log sl
LEFT JOIN companies c ON sl.company_id = c.id
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY company_id, c.name, DATE(created_at)
ORDER BY sync_date DESC, company_name;

-- Function to aggregate daily sync statistics
CREATE OR REPLACE FUNCTION aggregate_daily_sync_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO qb_sync_statistics (
        company_id,
        sync_date,
        period_type,
        total_syncs,
        successful_syncs,
        failed_syncs,
        total_records_processed,
        avg_processing_time_ms,
        total_processing_time_ms,
        last_sync_time
    )
    SELECT 
        company_id,
        target_date,
        'daily',
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'success'),
        COUNT(*) FILTER (WHERE status = 'error'),
        SUM(records_processed),
        AVG(processing_time_ms)::INTEGER,
        SUM(processing_time_ms),
        MAX(created_at)
    FROM qb_sync_log
    WHERE DATE(created_at) = target_date
        AND event_type = 'data_sync'
    GROUP BY company_id
    ON CONFLICT (company_id, sync_date, period_type) 
    DO UPDATE SET
        total_syncs = EXCLUDED.total_syncs,
        successful_syncs = EXCLUDED.successful_syncs,
        failed_syncs = EXCLUDED.failed_syncs,
        total_records_processed = EXCLUDED.total_records_processed,
        avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
        total_processing_time_ms = EXCLUDED.total_processing_time_ms,
        last_sync_time = EXCLUDED.last_sync_time,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for sync statistics to prevent duplicates
ALTER TABLE qb_sync_statistics 
ADD CONSTRAINT uk_sync_stats_company_date_period 
UNIQUE (company_id, sync_date, period_type, sync_hour);

-- Add comments
COMMENT ON TABLE qb_sync_log IS 'Detailed log of all QuickBooks synchronization activities and events';
COMMENT ON TABLE qb_sync_statistics IS 'Aggregated statistics for QuickBooks sync performance and health monitoring';
COMMENT ON COLUMN qb_sync_log.session_id IS 'QB Web Connector session ticket for grouping related operations';
COMMENT ON COLUMN qb_sync_log.processing_time_ms IS 'Time taken to process this operation in milliseconds';
COMMENT ON COLUMN qb_sync_statistics.period_type IS 'Aggregation period (hourly, daily, weekly, monthly)';
COMMENT ON VIEW recent_sync_activity IS 'Recent sync activities across all companies for monitoring';
COMMENT ON VIEW sync_error_summary IS 'Summary of sync errors for troubleshooting';
COMMENT ON VIEW sync_performance_summary IS 'Daily performance metrics for sync operations';
COMMENT ON FUNCTION aggregate_daily_sync_stats IS 'Aggregates daily sync statistics from detailed log entries';