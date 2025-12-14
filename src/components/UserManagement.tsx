import { useEffect, useState } from "react";

import { supabase, UserProfile, UserRole } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useToast } from "./ui/use-toast";
import {
  Search,
  Trash2,
  ArrowLeft,
  Users,
  Shield,
  Eye,
  UserCheck,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function formatRoleName(role: string) {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    operation_manager: "Operation Manager",
    operation_staff: "Operation Staff",
    accounting_manager: "Accounting Manager",
    accounting_staff: "Accounting Staff",
    customs_specialist: "Customs Specialist",
    read_only: "Read Only",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
    supervisor: "Supervisor",
  };

  return (
    map[role] ||
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function UserManagement() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { userRole } = useAuth();

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchUsers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = users;

    if (roleFilter !== "ALL") {
      filtered = filtered.filter((user) => user.role_name === roleFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    console.log("🔍 Fetching users...");

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📦 Raw data from Supabase:", data);
      console.log("❗ Supabase Error:", error);

      if (error) throw error;

      console.log("📊 Number of users returned:", data?.length);

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error: any) {
      console.error("❌ Fetch Users Error:", error);

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      console.log("✅ Fetch users completed.");
      setLoading(false);
    }
  };

  const ROLE_MAP: Record<UserRole, number> = {
    super_admin: 1,
    operation_manager: 2,
    operation_staff: 6,
    customs_specialist: 4,
    accounting_manager: 5,
    accounting_staff: 3,
    read_only: 7,
    supervisor: 15,
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      console.log("=== Update User Role Started ===");
      console.log("User ID:", userId);
      console.log("New Role:", newRole);

      const roleId = ROLE_MAP[newRole];
      console.log("Mapped Role ID:", roleId);

      if (!roleId) {
        throw new Error(`Invalid role: ${newRole}`);
      }

      const updateData = {
        role_id: roleId,
        updated_at: new Date().toISOString(),
      };
      console.log("Update Data:", updateData);

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (error) {
        console.error("Update Error:", error);
        throw error;
      }

      console.log("Update Successful");
      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("=== Update User Role Failed ===");
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User status updated successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(deleteUserId);
      if (error) throw error;
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteUserId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-blue-500 text-white"; // biru

      case "operation_manager":
        return "bg-amber-700 text-white"; // coklat

      case "operation_staff":
        return "bg-amber-200 text-amber-900"; // cream

      case "accounting_manager":
        return "bg-pink-500 text-white"; // pink

      case "accounting_staff":
        return "bg-purple-600 text-white"; // ungu

      case "customs_specialist":
        return "bg-green-600 text-white"; // hijau

      case "read_only":
        return "bg-gray-400 text-white"; // abu-abu

      case "supervisor":
        return "bg-slate-200 text-slate-900";

      default:
        return "bg-slate-200 text-slate-900"; // default soft
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 hover:bg-green-600 text-white cursor-pointer";
      case "inactive":
        return "bg-gray-400 hover:bg-gray-500 text-white cursor-pointer";
      case "suspended":
        return "bg-orange-500 hover:bg-orange-600 text-white cursor-pointer";
      default:
        return "cursor-pointer";
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const isAdmin = userProfile?.role_name === "super_admin";

  const summaryData = {
    total: users.length,
    admins: users.filter((user) => user.role_name === "super_admin").length,
    editors: users.filter((user) => user.role === "editor").length,
    viewers: users.filter((user) => user.role === "viewer").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with gradient */}
      <div className="border-b bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  User Management
                </h1>
                <p className="text-sm text-blue-100">
                  Kelola pengguna dan role akses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-purple-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Total Users
                </CardDescription>
                <Users className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <UserCheck className="mr-2 h-4 w-4" />
                Total pengguna
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-emerald-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Admins
                </CardDescription>
                <Shield className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.admins}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Shield className="mr-2 h-4 w-4" />
                Administrator
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-pink-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Editors
                </CardDescription>
                <Users className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.editors}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Users className="mr-2 h-4 w-4" />
                Editor
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-blue-400/90 text-white hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-white/90">
                  Viewers
                </CardDescription>
                <Eye className="h-8 w-8 text-white/80" />
              </div>
              <CardTitle className="text-4xl font-bold">
                {summaryData.viewers}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-white/90">
                <Eye className="mr-2 h-4 w-4" />
                Viewer
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Filter className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-lg">Filter & Pencarian</span>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari berdasarkan nama, email, atau role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[200px] border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Role</SelectItem>
                    <SelectItem value="super_admin">Admin</SelectItem>
                    <SelectItem value="accounting_manager">
                      Accounting Manager
                    </SelectItem>
                    <SelectItem value="accounting_staff">
                      Accounting Staff
                    </SelectItem>
                    <SelectItem value="operation_manager">
                      Operation Manager
                    </SelectItem>
                    <SelectItem value="operation_staff">
                      Operation Staff
                    </SelectItem>
                    <SelectItem value="customs_specialist">
                      Customs Specialist
                    </SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="read_only">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2">Memuat data users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-100 hover:to-blue-100">
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        Name
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Email
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        Role
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        Created
                      </div>
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="font-semibold text-slate-700 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Trash2 className="h-4 w-4 text-slate-600" />
                          Actions
                        </div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-indigo-50 transition-colors border-b border-slate-100"
                    >
                      <TableCell className="font-medium text-slate-900">
                        {user.full_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {isAdmin && user.id !== userProfile?.id ? (
                          <Select
                            value={user.role_name}
                            onValueChange={(value) =>
                              updateUserRole(user.id, value as UserRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">
                                Super Admin
                              </SelectItem>
                              <SelectItem value="operation_manager">
                                Operation Manager
                              </SelectItem>
                              <SelectItem value="operation_staff">
                                Operation Staff
                              </SelectItem>
                              <SelectItem value="accounting_manager">
                                Accounting Manager
                              </SelectItem>
                              <SelectItem value="accounting_staff">
                                Accounting Staff
                              </SelectItem>
                              <SelectItem value="customs_specialist">
                                Customs Specialist
                              </SelectItem>
                              <SelectItem value="supervisor">
                                Supervisor
                              </SelectItem>
                              <SelectItem value="read_only">
                                Read Only
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getRoleBadgeStyle(user.role_name)}>
                            {formatRoleName(user.role_name)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="focus:outline-none">
                                <Badge
                                  className={getStatusBadgeClass(
                                    user.status || "active",
                                  )}
                                >
                                  {user.status || "active"}
                                </Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUserStatus(user.id, "active")
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Active
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUserStatus(user.id, "inactive")
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                  Inactive
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUserStatus(user.id, "suspended")
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                  Suspended
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge
                            className={getStatusBadgeClass(
                              user.status || "active",
                            )}
                          >
                            {user.status || "active"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(user.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          {user.id !== userProfile?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteUserId(user.id)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                <Users className="h-12 w-12 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-lg">
                Tidak ada users ditemukan
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Coba ubah filter atau pencarian
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={() => setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
