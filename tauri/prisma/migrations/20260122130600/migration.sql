-- Remove branch field from git source configs
-- This migration removes the 'branch' field from all source config JSON objects where type is 'git'
-- SQLite JSON functions are used to update the config field

UPDATE source 
SET config = json_remove(config, '$.branch') 
WHERE type = 'git' AND json_extract(config, '$.branch') IS NOT NULL;
