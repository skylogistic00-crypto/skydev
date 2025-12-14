import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Loader2, RefreshCw, Edit } from "lucide-react";

interface FinanceTransaction {
  id: string;
  employee_name: string;
  merchant: string;
  category: string;
  date_trans: string;
  description: string | null;
  amount: number;
  ppn: number;
  total: number;
  file_url: string | null;
  status: string;
  created_at: string;
}

const CATEGORIES = [
  "All",
  "Travel",
  "Food",
  "Office Supplies",
  "Entertainment",
  "Utilities",
  "Transportation",
  "Medical",
  "Shopping",
  "Miscellaneous",
];

const STATUSES = ["All", "pending", "approved", "rejected"];

export default function FinanceTransactionsList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("finance_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (categoryFilter !== "All") {
        query = query.eq("category", categoryFilter);
      }

      if (statusFilter !== "All") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [categoryFilter, statusFilter]);

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      t.merchant.toLowerCase().includes(searchLower) ||
      t.employee_name.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Finance Transactions
            </h1>
            <p className="text-gray-500">
              Manage and track expense transactions
            </p>
          </div>
          <Button onClick={() => navigate("/finance/transactions/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by merchant or employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "All" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTransactions}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No transactions found</p>
                <Button
                  variant="link"
                  onClick={() => navigate("/finance/transactions/new")}
                >
                  Create your first transaction
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell 
                          className="font-medium cursor-pointer"
                          onClick={() =>
                            navigate(`/finance/transactions/${transaction.id}`)
                          }
                        >
                          {transaction.merchant}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/finance/transactions/${transaction.id}`)
                          }
                        >
                          {transaction.employee_name}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/finance/transactions/${transaction.id}`)
                          }
                        >
                          <Badge variant="outline">{transaction.category}</Badge>
                        </TableCell>
                        <TableCell 
                          className="text-right font-mono cursor-pointer"
                          onClick={() =>
                            navigate(`/finance/transactions/${transaction.id}`)
                          }
                        >
                          {formatCurrency(transaction.total)}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/finance/transactions/${transaction.id}`)
                          }
                        >
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/finance/transactions/${transaction.id}`)
                          }
                        >
                          {formatDate(transaction.date_trans)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/finance/transactions/edit/${transaction.id}`);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
