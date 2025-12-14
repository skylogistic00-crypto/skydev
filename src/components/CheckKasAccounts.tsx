import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CheckKasAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKasAccounts = async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_code, account_name, account_type, is_active, is_header')
        .ilike('account_name', '%kas%')
        .order('account_code');

      if (error) {
        console.error('Error fetching kas accounts:', error);
      } else {
        console.log('Kas accounts found:', data);
        setAccounts(data || []);
      }
      setLoading(false);
    };

    fetchKasAccounts();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Chart of Accounts - Kas Entries</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Account Code</th>
              <th className="border px-4 py-2">Account Name</th>
              <th className="border px-4 py-2">Account Type</th>
              <th className="border px-4 py-2">Active</th>
              <th className="border px-4 py-2">Header</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="border px-4 py-2 text-center text-gray-500">
                  No accounts found with "kas" in the name
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.account_code}>
                  <td className="border px-4 py-2">{acc.account_code}</td>
                  <td className="border px-4 py-2">{acc.account_name}</td>
                  <td className="border px-4 py-2">{acc.account_type}</td>
                  <td className="border px-4 py-2">{acc.is_active ? '✓' : '✗'}</td>
                  <td className="border px-4 py-2">{acc.is_header ? '✓' : '✗'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Query Used:</h3>
        <code className="text-sm">
          SELECT * FROM chart_of_accounts WHERE account_name ILIKE '%kas%' ORDER BY account_code
        </code>
        <p className="mt-2 text-sm text-gray-600">Total records: {accounts.length}</p>
      </div>
    </div>
  );
}
