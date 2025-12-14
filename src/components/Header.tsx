import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import HRDNotifications from "@/components/HRDNotifications";
import { AuthFormContent } from "@/components/AuthForm";

export default function Header({ publicMode = false }) {
  const { toast } = useToast();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [suspendedModal, setSuspendedModal] = useState(false);
  const [inactiveModal, setInactiveModal] = useState(false);

  // Always call useAuth to maintain hook order
  const authContext = useAuth();
  
  // Use auth context only if not in public mode
  const { user, signOut, userProfile } = publicMode
    ? { user: null, signOut: null, userProfile: null }
    : authContext;

  const handleSignOut = async () => {
    if (!signOut) return; // safety if public mode

    try {
      await signOut();
      toast({ title: "Success", description: "Signed out successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-1 py-1 flex items-center justify-between">
          <div 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 backdrop-blur-sm shadow-[inset_0_0_3px_rgba(255,255,255,0.6),_0_4px_10px_rgba(0,0,0,0.1)] border border-slate-200 hover:shadow-[0_6px_12px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer"
          >
            <img
              src="/logo.jpg"
              alt="Sakti Kargo Yaksa"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 [text-shadow:_1px_1px_3px_rgba(0,0,0,0.35)]">
                Sakti Kargo Yaksa
              </h1>
              <p className="text-xs text-slate-500 hidden sm:inline [text-shadow:_1px_1px_3px_rgba(0,0,0,0.35)]">
                Freight & Finance Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <HRDNotifications />

                <div className="hidden sm:flex flex-col items-end text-right leading-tight">
                  <span
                    className="text-base font-bold text-slate-900 tracking-wide
                  [text-shadow:_1px_1px_2px_rgba(0,0,0,0.25)]"
                  >
                    👋 Hallo {userProfile?.full_name || user.email}
                  </span>
                  <span
                    className="text-xs font-semibold text-slate-600 uppercase
                    [text-shadow:_0px_1px_1px_rgba(0,0,0,0.15)]"
                  >
                    {userProfile?.role_name
                      ? userProfile.role_name.replaceAll("_", " ")
                      : "User"}
                  </span>
                </div>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="shadow-sm hover:shadow-md transition-all"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowAuthDialog(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>User Authentication</DialogTitle>
            <DialogDescription>
              Sign in or create a new account
            </DialogDescription>
          </DialogHeader>

          <AuthFormContent
            isDialog={true}
            onSuccess={() => setShowAuthDialog(false)}
          />
        </DialogContent>
      </Dialog>
      {/* 🔥 Modal: Suspended */}
      <Dialog open={suspendedModal} onOpenChange={setSuspendedModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akun Ditangguhkan</DialogTitle>
            <DialogDescription>
              Akun Anda telah ditangguhkan oleh administrator.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSuspendedModal(false)}>OK</Button>
        </DialogContent>
      </Dialog>

      {/* 🔥 Modal: Inactive */}
      <Dialog open={inactiveModal} onOpenChange={setInactiveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akun Tidak Aktif</DialogTitle>
            <DialogDescription>
              Akun Anda tidak aktif, silakan hubungi administrator.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setInactiveModal(false)}>OK</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
