import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
} from "lucide-react";

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
  rejection_reason?: string;
}

interface BreakdownItem {
  id: string;
  transaction_id: string;
  qty: number;
  price: number;
  subtotal: number;
  description: string | null;
}

interface ApprovalRecord {
  id: string;
  transaction_id: string;
  level: string;
  status: string;
  approved_by: string | null;
  approved_by_name: string | null;
  notes: string | null;
  created_at: string;
}

const APPROVAL_LEVELS = ["finance", "manager", "accounting"];

export default function FinanceTransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [transaction, setTransaction] = useState<FinanceTransaction | null>(null);
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalNotes, setApprovalNotes] = useState("");

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from("finance_transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (transactionError) throw transactionError;
      setTransaction(transactionData);

      // Fetch breakdown items
      const { data: breakdownData, error: breakdownError } = await supabase
        .from("finance_transaction_breakdown")
        .select("*")
        .eq("transaction_id", id)
        .order("created_at", { ascending: true });

      if (breakdownError) throw breakdownError;
      setBreakdownItems(breakdownData || []);

      // Fetch approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from("finance_approvals")
        .select("*")
        .eq("transaction_id", id)
        .order("created_at", { ascending: true });

      if (approvalsError) throw approvalsError;
      setApprovals(approvalsData || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const getCurrentApprovalLevel = (): string | null => {
    const approvedLevels = approvals
      .filter((a) => a.status === "approved")
      .map((a) => a.level);

    for (const level of APPROVAL_LEVELS) {
      if (!approvedLevels.includes(level)) {
        return level;
      }
    }
    return null;
  };

  const handleApprovalClick = (action: "approve" | "reject") => {
    setApprovalAction(action);
    setApprovalNotes("");
    setShowApprovalDialog(true);
  };

  const handleApproval = async () => {
    if (!transaction || !user) return;

    const currentLevel = getCurrentApprovalLevel();
    if (!currentLevel) {
      toast({
        title: "Info",
        description: "All approval levels have been completed",
      });
      return;
    }

    setIsApproving(true);
    try {
      // Insert approval record
      const { error: approvalError } = await supabase
        .from("finance_approvals")
        .insert({
          transaction_id: transaction.id,
          level: currentLevel,
          status: approvalAction === "approve" ? "approved" : "rejected",
          approved_by: user.id,
          approved_by_name: userProfile?.full_name || user.email,
          notes: approvalNotes || null,
        });

      if (approvalError) throw approvalError;

      // Update transaction status
      let newStatus = transaction.status;
      if (approvalAction === "reject") {
        newStatus = "rejected";
      } else if (currentLevel === "accounting") {
        // Last level approved - mark as fully approved
        newStatus = "approved";

        // Call RPC to create journal entry
        try {
          const { error: rpcError } = await supabase.rpc(
            "create_journal_from_payload",
            {
              payload: {
                transaction_id: transaction.id,
                description: `Finance Transaction: ${transaction.merchant}`,
                amount: transaction.total,
                date: transaction.date_trans,
                category: transaction.category,
              },
            }
          );

          if (rpcError) {
            console.warn("Journal creation warning:", rpcError);
          }
        } catch (rpcErr) {
          console.warn("Journal RPC not available:", rpcErr);
        }
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from("finance_transactions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", transaction.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Transaction ${approvalAction === "approve" ? "approved" : "rejected"} at ${currentLevel} level`,
      });

      setShowApprovalDialog(false);
      fetchData();
    } catch (error) {
      console.error("Approval Error:", error);
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
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
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Transaction not found</p>
        <Button onClick={() => navigate("/finance/transactions")}>
          Back to List
        </Button>
      </div>
    );
  }

  const currentLevel = getCurrentApprovalLevel();
  const canApprove = transaction.status === "pending" && currentLevel !== null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/finance/transactions")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Transaction Detail
              </h1>
              <p className="text-gray-500">{transaction.merchant}</p>
            </div>
          </div>
          {getStatusBadge(transaction.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transaction Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Employee</Label>
                  <p className="font-medium">{transaction.employee_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Merchant</Label>
                  <p className="font-medium">{transaction.merchant}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Category</Label>
                  <p>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Date</Label>
                  <p className="font-medium">{formatDate(transaction.date_trans)}</p>
                </div>
              </div>

              {transaction.description && (
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <p className="mt-1">{transaction.description}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500">Amount</Label>
                    <p className="font-mono text-lg">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">PPN (10%)</Label>
                    <p className="font-mono text-lg">
                      {formatCurrency(transaction.ppn)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Total</Label>
                    <p className="font-mono text-lg font-bold text-blue-600">
                      {formatCurrency(transaction.total)}
                    </p>
                  </div>
                </div>
              </div>

              {transaction.file_url && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500">Attached Document</Label>
                  <div className="mt-2">
                    <a
                      href={transaction.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {transaction.status === "rejected" && transaction.rejection_reason && (
                <div className="border-t pt-4">
                  <Label className="text-red-600 font-semibold">Alasan Di Reject:</Label>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      {transaction.rejection_reason}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Approval</CardTitle>
              <CardDescription>
                {currentLevel
                  ? `Current level: ${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}`
                  : "All levels completed"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canApprove ? (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprovalClick("approve")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleApprovalClick("reject")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  {transaction.status === "approved"
                    ? "Transaction fully approved"
                    : transaction.status === "rejected"
                    ? "Transaction rejected"
                    : "No action available"}
                </p>
              )}

              {/* Approval Progress */}
              <div className="border-t pt-4">
                <Label className="text-gray-500 mb-2 block">
                  Approval Progress
                </Label>
                <div className="space-y-2">
                  {APPROVAL_LEVELS.map((level) => {
                    const approval = approvals.find((a) => a.level === level);
                    return (
                      <div
                        key={level}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="capitalize">{level}</span>
                        {approval ? (
                          getApprovalStatusBadge(approval.status)
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Items */}
        {breakdownItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Items</CardTitle>
              <CardDescription>
                {breakdownItems.length} item(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdownItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Approval History */}
        {approvals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="capitalize font-medium">
                        {approval.level}
                      </TableCell>
                      <TableCell>{getApprovalStatusBadge(approval.status)}</TableCell>
                      <TableCell>{approval.approved_by_name || "-"}</TableCell>
                      <TableCell>{approval.notes || "-"}</TableCell>
                      <TableCell>{formatDateTime(approval.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve" : "Reject"} Transaction
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? `Approve this transaction at ${currentLevel} level?`
                : "Are you sure you want to reject this transaction?"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproval}
              disabled={isApproving}
              className={
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
              variant={approvalAction === "reject" ? "destructive" : "default"}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : approvalAction === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
