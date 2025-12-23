import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function BankMutationReview() {
  const [mutations, setMutations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("bank_mutations_staging")
      .select("*")
      .in("review_status", ["REQUIRED", "AUTO"]);

    setMutations(data || []);
  }

  async function approveMutation(mutation: any) {
    // 1️⃣ Approve
    await supabase
      .from("bank_mutations_staging")
      .update({ review_status: "APPROVED" })
      .eq("id", mutation.id);

    // 2️⃣ Auto match
    await supabase.rpc("auto_match_bank_mutation", {
      p_mutation_id: mutation.id
    });

    await loadData();
  }

  async function rejectMutation(mutation: any) {
    await supabase
      .from("bank_mutations_staging")
      .update({ review_status: "REJECTED" })
      .eq("id", mutation.id);

    await loadData();
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Bank Mutation Review</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Deskripsi</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {mutations.map(m => (
            <tr key={m.id}>
              <td>{m.mutation_date}</td>
              <td>{m.description}</td>
              <td>{m.amount}</td>
              <td>{m.review_status}</td>
              <td className="space-x-2">
                <Button onClick={() => approveMutation(m)}>
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => rejectMutation(m)}
                >
                  Reject
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
