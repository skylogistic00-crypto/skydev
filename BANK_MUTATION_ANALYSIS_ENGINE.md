# Bank Mutation Analysis Engine

## Overview
AI-powered engine that analyzes bank mutations and maps them to Chart of Accounts without creating new transactions.

## Key Rules

### MANDATORY
1. **Category**: MUST be fetched from `chart_of_accounts` based on `debit_account_code`
2. **Payment Type**: NEVER set by AI
3. **No Transaction Creation**: NEVER create invoice, kasbon, or business transactions
4. **Ambiguous Keywords**: Force `is_ambiguous=true` and `confidence<60`

### Ambiguous Keywords
- kasbon
- reimburse
- panjar
- talangan
- advance
- pinjam
- ganti
- reimb
- penggantian
- uang muka

## API Endpoint

### POST `/functions/v1/supabase-functions-bank-mutation-analysis`

**Single Mutation:**
```json
{
  "mutation_id": "uuid"
}
```

**Batch Mutations:**
```json
{
  "mutation_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "results": [
    {
      "mutation_id": "uuid",
      "source": "AI_ANALYSIS",
      "debit_account_code": "1-1110",
      "credit_account_code": "4-0100",
      "confidence": 85,
      "is_ambiguous": false,
      "reasoning": "Penjualan barang - uang masuk ke bank"
    }
  ]
}
```

## Logic Flow

### Debit Mutation (Money In)
```
Debit: Bank/Kas (1-1xxx)
Credit: Pendapatan/Piutang/Modal (4-xxxx, 1-2xxx, 3-xxxx)
```

### Credit Mutation (Money Out)
```
Debit: Beban/Aset/Hutang (6-xxxx, 1-5xxx, 2-xxxx)
Credit: Bank/Kas (1-1xxx)
```

## Confidence Rules

| Condition | Confidence | is_ambiguous |
|-----------|-----------|--------------|
| Clear keyword match | > 80 | false |
| Ambiguous keyword detected | < 60 | true |
| Uncertain mapping | 60-80 | false |

## Example Usage

### Frontend Integration
```typescript
import { supabase } from "@/lib/supabase";

const analyzeBankMutation = async (mutationId: string) => {
  const { data, error } = await supabase.functions.invoke(
    "supabase-functions-bank-mutation-analysis",
    {
      body: { mutation_id: mutationId }
    }
  );

  if (error) {
    console.error("Analysis error:", error);
    return;
  }

  const result = data.results[0];
  
  if (result.is_ambiguous) {
    console.log("⚠ Requires manual review");
  } else {
    console.log("✓ Auto-mapped:", result.debit_account_code, "→", result.credit_account_code);
  }
};
```

### Batch Analysis
```typescript
const analyzeBatch = async (mutationIds: string[]) => {
  const { data, error } = await supabase.functions.invoke(
    "supabase-functions-bank-mutation-analysis",
    {
      body: { mutation_ids: mutationIds }
    }
  );

  const needsReview = data.results.filter(r => r.is_ambiguous);
  const autoMapped = data.results.filter(r => !r.is_ambiguous);

  console.log(`✓ Auto-mapped: ${autoMapped.length}`);
  console.log(`⚠ Needs review: ${needsReview.length}`);
};
```

## Integration with BankReconciliation.tsx

Add analysis step before matching:

```typescript
const handleAnalyzeAndMatch = async (mutation: BankMutationStaging) => {
  try {
    // 1. Analyze mutation
    const { data: analysisData } = await supabase.functions.invoke(
      "supabase-functions-bank-mutation-analysis",
      { body: { mutation_id: mutation.id } }
    );

    const analysis = analysisData.results[0];

    if (analysis.is_ambiguous) {
      toast({
        title: "Membutuhkan Review Manual",
        description: `Confidence: ${analysis.confidence}% - ${analysis.reasoning}`,
        variant: "default"
      });
      return;
    }

    // 2. Update mutation with analyzed accounts
    await supabase
      .from("bank_mutations_staging")
      .update({
        debit_account_code: analysis.debit_account_code,
        credit_account_code: analysis.credit_account_code,
        ai_confidence: analysis.confidence
      })
      .eq("id", mutation.id);

    // 3. Auto match
    await supabase.rpc("auto_match_bank_mutation", {
      p_mutation_id: mutation.id
    });

    toast({
      title: "Berhasil",
      description: `Analyzed & matched (confidence: ${analysis.confidence}%)`
    });

    loadMutations();
  } catch (err) {
    console.error("Error:", err);
  }
};
```

## Output Contract

```typescript
interface AnalysisResult {
  mutation_id: string;
  source: "AI_ANALYSIS";
  debit_account_code: string;   // MUST exist in chart_of_accounts
  credit_account_code: string;  // MUST exist in chart_of_accounts
  confidence: number;            // 0-100
  is_ambiguous: boolean;         // true if ambiguous keyword detected
  reasoning?: string;            // AI explanation
}
```

## What AI Does NOT Do

- ❌ Create invoice
- ❌ Create kasbon
- ❌ Create business transactions
- ❌ Set payment_type
- ❌ Set category directly
- ❌ Modify amount or date
- ❌ Create new COA accounts

## What AI Does

- ✅ Map to existing COA accounts
- ✅ Detect ambiguous keywords
- ✅ Calculate confidence score
- ✅ Provide reasoning
- ✅ Follow double-entry rules
