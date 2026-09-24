import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  Upload,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
} from "lucide-react";
import AdminTabNav from "@/components/AdminTabNav";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useHeroSlides, type HeroSlide } from "@/hooks/useHeroSlides";
import { useQueryClient } from "@tanstack/react-query";

type DeviceKey = "pc" | "tablet" | "phone";

const DEVICES: { key: DeviceKey; label: string; Icon: any; col: keyof HeroSlide }[] = [
  { key: "pc", label: "PC", Icon: Monitor, col: "pc_image_url" },
  { key: "tablet", label: "Tablet", Icon: Tablet, col: "tablet_image_url" },
  { key: "phone", label: "Phone", Icon: Smartphone, col: "phone_image_url" },
];

interface SlideForm {
  pc_image_url: string | null;
  tablet_image_url: string | null;
  phone_image_url: string | null;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm: SlideForm = {
  pc_image_url: null,
  tablet_image_url: null,
  phone_image_url: null,
  link_url: "",
  display_order: 0,
  is_active: true,
};

const AdminHeroSlides = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: slides = [], isLoading, refetch } = useHeroSlides(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SlideForm>({ ...emptyForm });
  const [pendingFiles, setPendingFiles] = useState<Record<DeviceKey, File | null>>({
    pc: null,
    tablet: null,
    phone: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useAdminGuard();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["hero-slides"] });
    refetch();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const openAdd = () => {
    setEditingId(null);
    const maxOrder = slides.reduce((m, s) => Math.max(m, s.display_order), -1);
    setForm({ ...emptyForm, display_order: maxOrder + 1 });
    setPendingFiles({ pc: null, tablet: null, phone: null });
    setModalOpen(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditingId(s.id);
    setForm({
      pc_image_url: s.pc_image_url,
      tablet_image_url: s.tablet_image_url,
      phone_image_url: s.phone_image_url,
      link_url: s.link_url || "",
      display_order: s.display_order,
      is_active: s.is_active,
    });
    setPendingFiles({ pc: null, tablet: null, phone: null });
    setModalOpen(true);
  };

  const handleDelete = async (s: HeroSlide) => {
    if (!confirm("Delete this slide?")) return;
    const paths: string[] = [];
    (["pc_image_url", "tablet_image_url", "phone_image_url"] as const).forEach((k) => {
      const url = s[k];
      if (url) {
        const idx = url.indexOf("/hero-slides/");
        if (idx !== -1) paths.push(url.substring(idx + "/hero-slides/".length));
      }
    });
    if (paths.length) await supabase.storage.from("hero-slides").remove(paths);
    const { error } = await (supabase.from("hero_slides" as any) as any).delete().eq("id", s.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slide deleted" });
    invalidate();
  };

  const uploadFile = async (file: File, device: DeviceKey): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}-${device}.${ext}`;
    const { error } = await supabase.storage.from("hero-slides").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("hero-slides").getPublicUrl(path);
    return data.publicUrl;
  };

  const removeStorageByUrl = async (url: string | null) => {
    if (!url) return;
    const idx = url.indexOf("/hero-slides/");
    if (idx === -1) return;
    const path = url.substring(idx + "/hero-slides/".length);
    await supabase.storage.from("hero-slides").remove([path]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const next: SlideForm = { ...form };
      for (const d of DEVICES) {
        const file = pendingFiles[d.key];
        if (file) {
          // remove old image if replacing
          await removeStorageByUrl(form[d.col as keyof SlideForm] as string | null);
          const url = await uploadFile(file, d.key);
          (next as any)[d.col] = url;
        }
      }

      const payload = {
        pc_image_url: next.pc_image_url,
        tablet_image_url: next.tablet_image_url,
        phone_image_url: next.phone_image_url,
        link_url: next.link_url.trim() || null,
        display_order: Number(next.display_order) || 0,
        is_active: next.is_active,
      };

      if (editingId) {
        const { error } = await (supabase.from("hero_slides" as any) as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Slide updated" });
      } else {
        const { error } = await (supabase.from("hero_slides" as any) as any).insert([payload]);
        if (error) throw error;
        toast({ title: "Slide added" });
      }
      setModalOpen(false);
      invalidate();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const removeImageFromForm = async (device: DeviceKey) => {
    const col = DEVICES.find((d) => d.key === device)!.col as keyof SlideForm;
    setPendingFiles((p) => ({ ...p, [device]: null }));
    setForm((prev) => ({ ...prev, [col]: null } as SlideForm));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        <div className="flex items-center justify-between md:block">
          <div>
            <h1 className="font-display text-lg md:text-2xl text-foreground">Hero Slides</h1>
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
            <Plus size={14} className="mr-1" /> Add New Slide
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
        ) : slides.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="font-display text-xl text-foreground mb-1">No slides yet</p>
            <p className="font-body text-[13px] text-muted-foreground mb-6">
              Add your first slide to get started.
            </p>
            <Button variant="gold" onClick={openAdd}>
              <Plus size={14} className="mr-1.5" /> Add New Slide
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Preview</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Devices</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Link</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Order</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Status</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slides.map((s) => {
                    const preview = s.pc_image_url || s.tablet_image_url || s.phone_image_url;
                    return (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          {preview ? (
                            <img src={preview} alt="Slide" className="w-12 h-8 md:w-20 md:h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-8 md:w-20 md:h-12 rounded bg-secondary flex items-center justify-center">
                              <ImageIcon size={14} className="text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          <div className="flex items-center gap-2">
                            {DEVICES.map((d) => {
                              const has = !!(s[d.col] as string | null);
                              return (
                                <span
                                  key={d.key}
                                  title={`${d.label}: ${has ? "set" : "missing"}`}
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded ${has ? "text-gold" : "text-muted-foreground/40"}`}
                                >
                                  <d.Icon size={14} />
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="font-body text-[10px] md:text-[12px] text-muted-foreground px-2 md:px-4 py-2 md:py-3 max-w-[200px] truncate">
                          {s.link_url || "—"}
                        </td>
                        <td className="font-body text-[10px] md:text-[12px] text-foreground px-2 md:px-4 py-2 md:py-3">
                          {s.display_order}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          <button
                            onClick={async () => {
                              const newStatus = !s.is_active;
                              const { error } = await (supabase.from("hero_slides" as any) as any)
                                .update({ is_active: newStatus })
                                .eq("id", s.id);
                              if (error) {
                                toast({ title: "Failed to update", description: error.message, variant: "destructive" });
                              } else {
                                toast({ title: newStatus ? "Activated" : "Deactivated" });
                                invalidate();
                              }
                            }}
                            className="flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.is_active ? "bg-green-500" : "bg-red-500"}`} />
                            <span className={`font-body text-[10px] md:text-[11px] ${s.is_active ? "text-green-600" : "text-red-500"}`}>
                              {s.is_active ? "Active" : "Inactive"}
                            </span>
                          </button>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9" onClick={() => openEdit(s)}>
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-9 md:w-9 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(s)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Slide Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground">
              {editingId ? "Edit Slide" : "Add New Slide"}
            </DialogTitle>
            <DialogDescription className="font-body text-[13px] text-muted-foreground">
              Upload one image per device. Slides cycle automatically on the homepage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEVICES.map((d) => {
                const col = d.col as keyof SlideForm;
                const existingUrl = form[col] as string | null;
                const pending = pendingFiles[d.key];
                const previewUrl = pending ? URL.createObjectURL(pending) : existingUrl;
                return (
                  <div key={d.key} className="border border-border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
                      <d.Icon className="w-4 h-4 text-gold" /> {d.label}
                    </div>
                    <div className="aspect-video bg-secondary rounded mb-2 overflow-hidden flex items-center justify-center">
                      {previewUrl ? (
                        <img src={previewUrl} alt={`${d.label} preview`} className="w-full h-full object-cover" />
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
                            if (f) setPendingFiles((p) => ({ ...p, [d.key]: f }));
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
                          onClick={() => removeImageFromForm(d.key)}
                          className="text-xs h-8 px-2 border border-border rounded hover:bg-secondary"
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                  Link URL (optional)
                </Label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                  placeholder="/collection/luxury or https://..."
                />
              </div>
              <div>
                <Label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                  Display order
                </Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Active (show on homepage)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : editingId ? (
                  "Save Changes"
                ) : (
                  "Add Slide"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHeroSlides;
