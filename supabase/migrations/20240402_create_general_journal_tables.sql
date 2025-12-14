-- Create general_journal table
create table general_journal (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  reference_no text,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamp default now()
);

-- Create general_journal_lines table
create table general_journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid references general_journal(id) on delete cascade,
  account_code text not null,
  account_name text not null,
  debit numeric default 0,
  credit numeric default 0,
  note text,
  created_at timestamp default now()
);

-- Enable RLS
alter table general_journal enable row level security;
alter table general_journal_lines enable row level security;

-- RLS Policies for general_journal
create policy "Users can view their own journals"
  on general_journal for select
  using (auth.uid() = created_by);

create policy "Users can insert their own journals"
  on general_journal for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own journals"
  on general_journal for update
  using (auth.uid() = created_by);

create policy "Users can delete their own journals"
  on general_journal for delete
  using (auth.uid() = created_by);

-- RLS Policies for general_journal_lines
create policy "Users can view journal lines"
  on general_journal_lines for select
  using (
    exists (
      select 1 from general_journal
      where general_journal.id = general_journal_lines.journal_id
      and general_journal.created_by = auth.uid()
    )
  );

create policy "Users can insert journal lines"
  on general_journal_lines for insert
  with check (
    exists (
      select 1 from general_journal
      where general_journal.id = general_journal_lines.journal_id
      and general_journal.created_by = auth.uid()
    )
  );

create policy "Users can update journal lines"
  on general_journal_lines for update
  using (
    exists (
      select 1 from general_journal
      where general_journal.id = general_journal_lines.journal_id
      and general_journal.created_by = auth.uid()
    )
  );

create policy "Users can delete journal lines"
  on general_journal_lines for delete
  using (
    exists (
      select 1 from general_journal
      where general_journal.id = general_journal_lines.journal_id
      and general_journal.created_by = auth.uid()
    )
  );
