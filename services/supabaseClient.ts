import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsgbakkwfszirldtfufu.supabase.co';
const supabaseKey = 'sb_publishable_c6gm_TynuTCh0Ds8kfuRfQ_rFMNqsz6';

export const supabase = createClient(supabaseUrl, supabaseKey);