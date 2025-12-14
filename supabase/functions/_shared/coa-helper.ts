import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface COADetails {
  id: string;
  account_code: string;
  account_name: string;
  normal_balance: string;
  account_type: string;
  level: number;
}

/**
 * Get COA details by account_id
 */
export async function getAccountCOA(
  supabase: SupabaseClient,
  accountId: string
): Promise<COADetails | null> {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('id, account_code, account_name, normal_balance, account_type, level')
    .eq('id', accountId)
    .single();

  if (error || !data) {
    console.error('Error fetching COA by id:', error);
    return null;
  }

  return data as COADetails;
}

/**
 * Get COA details by account_code
 */
export async function getAccountCOAByCode(
  supabase: SupabaseClient,
  accountCode: string
): Promise<COADetails | null> {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('id, account_code, account_name, normal_balance, account_type, level')
    .eq('account_code', accountCode)
    .single();

  if (error || !data) {
    console.error('Error fetching COA by code:', error);
    return null;
  }

  return data as COADetails;
}

/**
 * Resolve COA details - accepts either account_id or account_code
 * Returns full COA details including id, code, and name
 */
export async function resolveCOA(
  supabase: SupabaseClient,
  params: { account_id?: string; account_code?: string }
): Promise<COADetails | null> {
  if (params.account_id) {
    return getAccountCOA(supabase, params.account_id);
  }
  
  if (params.account_code) {
    return getAccountCOAByCode(supabase, params.account_code);
  }

  return null;
}

/**
 * Build journal entry with resolved COA details
 */
export interface JournalEntryInput {
  account_id?: string;
  account_code?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface ResolvedJournalEntry {
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

export async function resolveJournalEntries(
  supabase: SupabaseClient,
  entries: JournalEntryInput[]
): Promise<ResolvedJournalEntry[]> {
  const resolvedEntries: ResolvedJournalEntry[] = [];

  for (const entry of entries) {
    const coa = await resolveCOA(supabase, {
      account_id: entry.account_id,
      account_code: entry.account_code,
    });

    if (!coa) {
      throw new Error(
        `COA not found for account_id: ${entry.account_id} or account_code: ${entry.account_code}`
      );
    }

    resolvedEntries.push({
      account_id: coa.id,
      account_code: coa.account_code,
      account_name: coa.account_name,
      debit: entry.debit,
      credit: entry.credit,
      description: entry.description,
    });
  }

  return resolvedEntries;
}

/**
 * Insert journal entries with auto-resolved COA details
 */
export async function insertJournalWithCOA(
  supabase: SupabaseClient,
  params: {
    journalRef: string;
    date: string;
    description: string;
    entries: JournalEntryInput[];
    createdBy?: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<{ journalEntryId: string; entries: ResolvedJournalEntry[] }> {
  // Resolve all COA details
  const resolvedEntries = await resolveJournalEntries(supabase, params.entries);

  // Calculate totals
  const totalDebit = resolvedEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = resolvedEntries.reduce((sum, e) => sum + e.credit, 0);

  // Validate balance
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Journal not balanced: Debit (${totalDebit}) != Credit (${totalCredit})`
    );
  }

  // Create journal entry header
  const journalEntryId = crypto.randomUUID();
  const { error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      id: journalEntryId,
      journal_ref: params.journalRef,
      entry_date: params.date,
      transaction_date: params.date,
      description: params.description,
      total_debit: totalDebit,
      total_credit: totalCredit,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      status: 'posted',
      created_by: params.createdBy,
    });

  if (journalError) {
    throw new Error(`Failed to create journal entry: ${journalError.message}`);
  }

  // Insert journal entry lines
  const journalLines = resolvedEntries.map((entry) => ({
    journal_entry_id: journalEntryId,
    account_id: entry.account_id,
    account_code: entry.account_code,
    account_name: entry.account_name,
    debit: entry.debit,
    credit: entry.credit,
    description: entry.description || params.description,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(journalLines);

  if (linesError) {
    throw new Error(`Failed to create journal lines: ${linesError.message}`);
  }

  // Insert to general ledger
  const glEntries = resolvedEntries.map((entry) => ({
    journal_entry_id: journalEntryId,
    account_id: entry.account_id,
    account_code: entry.account_code,
    account_name: entry.account_name,
    date: params.date,
    debit: entry.debit,
    credit: entry.credit,
    description: entry.description || params.description,
  }));

  const { error: glError } = await supabase
    .from('general_ledger')
    .insert(glEntries);

  if (glError) {
    throw new Error(`Failed to create general ledger entries: ${glError.message}`);
  }

  return { journalEntryId, entries: resolvedEntries };
}
