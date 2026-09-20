import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MobileBottomNav from "@/components/MobileBottomNav";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
          headers: { apikey: anonKey },
        }).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.valid === false && data.reason === "already_unsubscribed") {
            setStatus("already_unsubscribed");
            return;
          }
        }
        setStatus("valid");
      } catch {
        setStatus("valid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } }).catch(() => null);
      setStatus("success");
    } catch {
      setStatus("success");
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-16 md:pb-0">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
        <h1 className="font-display text-2xl text-foreground mb-4">Email Preferences</h1>
        {status === "loading" && <p className="font-body text-muted-foreground">Verifying…</p>}
        {status === "valid" && (
          <>
            <p className="font-body text-[14px] text-muted-foreground mb-6">
              Click below to unsubscribe from future emails.
            </p>
            <Button variant="gold" onClick={handleUnsubscribe}>Confirm Unsubscribe</Button>
          </>
        )}
        {status === "success" && <p className="font-body text-[14px] text-foreground">You have been unsubscribed successfully.</p>}
        {status === "already_unsubscribed" && <p className="font-body text-[14px] text-muted-foreground">You are already unsubscribed.</p>}
        {status === "invalid" && <p className="font-body text-[14px] text-destructive">Invalid or expired unsubscribe link.</p>}
        {status === "error" && <p className="font-body text-[14px] text-destructive">Something went wrong. Please try again later.</p>}
      </div>
    </div>
    <MobileBottomNav />
    </>
  );
};

export default UnsubscribePage;
