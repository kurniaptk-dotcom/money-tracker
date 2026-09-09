"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Home,
  User,
  Plane,
  Briefcase,
  Laptop,
  Building2,
  Gift,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categorySchema, type CategoryInput } from "@/lib/validators";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  film: Film,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  home: Home,
  user: User,
  plane: Plane,
  briefcase: Briefcase,
  laptop: Laptop,
  "building-2": Building2,
  gift: Gift,
  "trending-up": TrendingUp,
  "more-horizontal": MoreHorizontal,
};

const colorOptions = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

export function CategoryList() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("utensils");
  const [selectedColor, setSelectedColor] = useState("#ef4444");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "utensils",
      color: "#ef4444",
    },
  });

  const watchType = watch("type");

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${user?.id},user_id.is.null`)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setIsLoading(false);
  };

  const onSubmit = async (data: CategoryInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    if (editingCategory) {
      const { error } = await supabase
        .from("categories")
        .update({
          name: data.name,
          type: data.type,
          icon: selectedIcon,
          color: selectedColor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCategory.id);

      if (!error) {
        fetchCategories();
        setIsDialogOpen(false);
        setEditingCategory(null);
        reset();
      }
    } else {
      const { error } = await supabase.from("categories").insert({
        user_id: user?.id,
        name: data.name,
        type: data.type,
        icon: selectedIcon,
        color: selectedColor,
        is_default: false,
      });

      if (!error) {
        fetchCategories();
        setIsDialogOpen(false);
        reset();
      }
    }
    setIsSubmitting(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("type", category.type as CategoryInput["type"]);
    setSelectedIcon(category.icon || "utensils");
    setSelectedColor(category.color || "#ef4444");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (!error) {
      fetchCategories();
      setDeleteConfirmId(null);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori</h1>
          <p className="text-muted-foreground">Kelola kategori transaksi Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            reset();
            setSelectedIcon("utensils");
            setSelectedColor("#ef4444");
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
          <TabsTrigger value="income">Pemasukan</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expenseCategories.map((category) => {
              const Icon = (category.icon ? iconMap[category.icon] : null) || MoreHorizontal;
              return (
                <Card key={category.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {category.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color || "#ef4444" }}
                      />
                      {!category.is_default && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirmId(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Icon
                      className="h-6 w-6"
                      style={{ color: category.color || "#ef4444" }}
                    />
                    {category.is_default && (
                      <Badge variant="secondary" className="mt-2">
                        Default
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="income" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {incomeCategories.map((category) => {
              const Icon = (category.icon ? iconMap[category.icon] : null) || MoreHorizontal;
              return (
                <Card key={category.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {category.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color || "#22c55e" }}
                      />
                      {!category.is_default && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirmId(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Icon
                      className="h-6 w-6"
                      style={{ color: category.color || "#22c55e" }}
                    />
                    {category.is_default && (
                      <Badge variant="secondary" className="mt-2">
                        Default
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Ubah detail kategori Anda"
                : "Tambahkan kategori baru untuk mengorganisir transaksi"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input
                id="name"
                placeholder="Contoh: Makanan, Transportasi"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe</Label>
              <Select
                value={watchType}
                onValueChange={(value) =>
                  setValue("type", value as CategoryInput["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(iconMap).map((iconName) => {
                  const Icon = iconMap[iconName];
                  return (
                    <Button
                      key={iconName}
                      type="button"
                      variant={selectedIcon === iconName ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setSelectedIcon(iconName)}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant={selectedColor === color ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setSelectedColor(color)}
                  >
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingCategory ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
