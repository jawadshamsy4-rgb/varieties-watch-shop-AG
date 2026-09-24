import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Plus, Pencil, Trash2, Image as ImageIcon, X, Upload } from "lucide-react";
import AdminTabNav from "@/components/AdminTabNav";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useBrands, type Brand } from "@/hooks/useBrands";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminGuard } from "@/hooks/useAdminGuard";

interface BrandForm {
  label: string;
  image_url: string | null;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm: BrandForm = {
  label: "",
  image_url: null,
  link_url: "",
  display_order: 0,
  is_active: true,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const autoLinkFor = (label: string) => (label.trim() ? `/brands/${slugify(label)}` : "");

const AdminBrands = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: brands = [], isLoading, refetch } = useBrands(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandForm>({ ...emptyForm });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlightController = useRef<AbortController | null>(null);

  const cancelModal = () => {
    if (inFlightController.current) {
      inFlightController.current.abort();
      inFlightController.current = null;
    }
    setModalOpen(false);
    setSubmitting(false);
  };

  useAdminGuard();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["brands"] });
    refetch();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const openAdd = () => {
    setEditingId(null);
    const maxOrder = brands.reduce((m, b) => Math.max(m, b.display_order), -1);
    setForm({ ...emptyForm, display_order: maxOrder + 1 });
    setPendingFile(null);
    setModalOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditingId(b.id);
    setForm({
      label: b.label,
      image_url: b.image_url,
      link_url: b.link_url || "",
      display_order: b.display_order,
      is_active: b.is_active,
    });
    setPendingFile(null);
    setModalOpen(true);
  };

  const removeStorageByUrl = async (url: string | null) => {
    if (!url) return;
    const idx = url.indexOf("/brand-images/");
    if (idx === -1) return;
    const path = url.substring(idx + "/brand-images/".length);
    await supabase.storage.from("brand-images").remove([path]);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await withTimeout(
      supabase.storage.from("brand-images").upload(path, file),
      60000,
      "Upload timed out"
    );
    if (error) throw error;
    const { data } = supabase.storage.from("brand-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDelete = async (b: Brand) => {
    if (!confirm("Delete this brand?")) return;
    await removeStorageByUrl(b.image_url);
    const { error } = await (supabase.from("brands" as any) as any).delete().eq("id", b.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Brand deleted" });
    invalidate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) {
      toast({ title: "Label is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = form.image_url;
      if (pendingFile) {
        await removeStorageByUrl(form.image_url);
        imageUrl = await uploadFile(pendingFile);
      }

      const payload = {
        label: form.label.trim(),
        image_url: imageUrl,
        link_url: (form.link_url.trim() || autoLinkFor(form.label)) || null,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
      };

      if (editingId) {
        const controller = new AbortController();
        inFlightController.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const { error } = await (supabase.from("brands" as any) as any)
            .update(payload)
            .eq("id", editingId)
            .abortSignal(controller.signal);
          if (error) throw error;
          toast({ title: "Brand updated" });
        } catch (err: any) {
          // The write very likely landed even if the response was slow.
          // Refresh and tell the user to confirm rather than hard-failing.
          invalidate();
          if (err?.name === "AbortError" || /aborted|timed out|timeout/i.test(err?.message || "")) {
            toast({
              title: "Saved (slow response)",
              description: "The update may have completed. Refreshing the list…",
            });
            setModalOpen(false);
            return;
          }
          throw err;
        } finally {
          clearTimeout(timeoutId);
          if (inFlightController.current === controller) inFlightController.current = null;
        }
      } else {
        const controller = new AbortController();
        inFlightController.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const { error } = await (supabase.from("brands" as any) as any)
            .insert([payload])
            .abortSignal(controller.signal);
          if (error) throw error;
          toast({ title: "Brand added" });
        } catch (err: any) {
          invalidate();
          if (err?.name === "AbortError" || /aborted|timed out|timeout/i.test(err?.message || "")) {
            toast({
              title: "Saved (slow response)",
              description: "The brand may have been added. Refreshing the list…",
            });
            setModalOpen(false);
            return;
          }
          throw err;
        } finally {
          clearTimeout(timeoutId);
          if (inFlightController.current === controller) inFlightController.current = null;
        }
      }
      setModalOpen(false);
      invalidate();
    } catch (err: any) {
      const msg = err?.message || "";
      const isAbort = err?.name === "AbortError" || /aborted|signal is aborted/i.test(msg);
      if (!isAbort) {
        toast({ title: "Save failed", description: msg, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : form.image_url;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        <div className="flex items-center justify-between md:block">
          <div>
            <h1 className="font-display text-lg md:text-2xl text-foreground">Brands</h1>
            <p className="font-body text-[10px] md:text-[12px] text-muted-foreground">
              Varieties Watch Shop — Admin Dashboard
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="md:hidden">
            <LogOut size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="gold" size="sm" onClick={openAdd} className="text-[11px] md:text-sm flex-1 md:flex-none">
            <Plus size={14} className="mr-1" /> Add New Brand
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
            <LogOut size={14} className="mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <AdminTabNav />

      <div className="px-3 md:px-6 py-4 md:py-6">
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading…</div>
        ) : brands.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="font-display text-xl text-foreground mb-1">No brands yet</p>
            <p className="font-body text-[13px] text-muted-foreground mb-6">
              Add your first brand to get started.
            </p>
            <Button variant="gold" onClick={openAdd}>
              <Plus size={14} className="mr-1.5" /> Add New Brand
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Image</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Label</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Link</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Order</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Status</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-2 md:px-4 py-2 md:py-3">
                        {b.image_url ? (
                          <img src={b.image_url} alt={b.label} className="w-12 h-8 md:w-20 md:h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-8 md:w-20 md:h-12 rounded bg-secondary flex items-center justify-center">
                            <ImageIcon size={14} className="text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="font-body text-[11px] md:text-[13px] text-foreground px-2 md:px-4 py-2 md:py-3">
                        {b.label}
                      </td>
                      <td className="font-body text-[10px] md:text-[12px] text-muted-foreground px-2 md:px-4 py-2 md:py-3 max-w-[200px] truncate">
                        {b.link_url || "—"}
                      </td>
                      <td className="font-body text-[10px] md:text-[12px] text-foreground px-2 md:px-4 py-2 md:py-3">
                        {b.display_order}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3">
                        <button
                          onClick={async () => {
                            const newStatus = !b.is_active;
                            const { error } = await (supabase.from("brands" as any) as any)
                              .update({ is_active: newStatus })
                              .eq("id", b.id);
                            if (error) {
                              toast({ title: "Failed to update", description: error.message, variant: "destructive" });
                            } else {
                              toast({ title: newStatus ? "Activated" : "Deactivated" });
                              invalidate();
                            }
                          }}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${b.is_active ? "bg-green-500" : "bg-red-500"}`} />
                          <span className={`font-body text-[10px] md:text-[11px] ${b.is_active ? "text-green-600" : "text-red-500"}`}>
                            {b.is_active ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9" onClick={() => openEdit(b)}>
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-9 md:w-9 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(b)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) cancelModal(); else setModalOpen(true); }}>
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground">
              {editingId ? "Edit Brand" : "Add New Brand"}
            </DialogTitle>
            <DialogDescription className="font-body text-[13px] text-muted-foreground">
              Brand cards appear in the Featured Brands section.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="border border-border rounded-md p-3">
              <Label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-2 block">
                Background Image
              </Label>
              <div className="aspect-square bg-secondary rounded mb-2 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f) setPendingFile(f);
                      e.target.value = "";
                    }}
                  />
                  <span className="flex items-center justify-center gap-1 text-xs h-8 border border-border rounded cursor-pointer hover:bg-secondary">
                    <Upload className="w-3 h-3" /> {previewUrl ? "Replace" : "Upload"}
                  </span>
                </label>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingFile(null);
                      setForm((p) => ({ ...p, image_url: null }));
                    }}
                    className="text-xs h-8 px-2 border border-border rounded hover:bg-secondary"
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <Label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Label (Brand Text)
              </Label>
              <Input
                value={form.label}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setForm((p) => {
                    const prevAuto = autoLinkFor(p.label);
                    const linkIsAuto = !p.link_url.trim() || p.link_url.trim() === prevAuto;
                    return {
                      ...p,
                      label: newLabel,
                      link_url: linkIsAuto ? autoLinkFor(newLabel) : p.link_url,
                    };
                  });
                }}
                placeholder="e.g. Rolex"
                required
              />
            </div>

            <div>
              <Label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Link URL (optional)
              </Label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                placeholder="/collection/rolex"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                  Display Order
                </Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="font-body text-[12px] text-foreground">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={cancelModal}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Add Brand"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBrands;