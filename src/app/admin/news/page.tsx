"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { PixelIcon } from "@/components/trade/PixelIcon";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  category: string;
  channel: string;
  date: string;
  icon?: string;
  gradient?: string;
  border?: string;
  published: boolean;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "news" as const,
  channel: "#announcements",
  date: new Date().toISOString().split("T")[0],
  icon: "📰",
  gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
  border: "#1e3a5f",
};

export default function AdminNewsPage() {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (!isDev) return;
    loadPosts();
  }, [isDev]);

  async function loadPosts() {
    try {
      const res = await fetch("/api/news");
      const data = (await res.json()) as { posts: NewsItem[] };
      setPosts(data.posts ?? []);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingId ? `/api/news/${editingId}` : "/api/news";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to save post");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(post: NewsItem) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      description: post.description,
      category: post.category as "news" | "updates" | "leaks",
      channel: post.channel,
      date: post.date,
      icon: post.icon || "📰",
      gradient: post.gradient || "linear-gradient(135deg, #fbbf24, #f59e0b)",
      border: post.border || "#1e3a5f",
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadPosts();
    } catch {
      setError("Failed to delete post");
    }
  }

  if (!isDev) {
    return (
      <div className="relative mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <p className="text-outline text-base text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          ADMIN PANEL UNAVAILABLE
        </p>
        <p className="mt-2 text-xs text-white/70">
          The admin panel is only available in development mode.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          NEWS ADMIN
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
          Create and manage news posts
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-black/20 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          {editingId ? "EDIT POST" : "NEW POST"}
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Post title"
              required
              className="stud-input h-9 text-sm text-gray-900"
              style={{ borderRadius: "0.875rem", fontFamily: "var(--font-pixel), monospace" }}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Post description"
              required
              rows={3}
              className="w-full rounded-xl border border-black/20 p-2 text-sm text-gray-900 shadow-sm"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as "news" | "updates" | "leaks" })}
              className="stud-input h-9 w-full text-sm text-gray-900"
              style={{ borderRadius: "0.875rem", fontFamily: "var(--font-pixel), monospace" }}
            >
              <option value="news">News</option>
              <option value="updates">Updates</option>
              <option value="leaks">Leaks</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">Channel</label>
            <Input
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
              placeholder="#announcements"
              required
              className="stud-input h-9 text-sm text-gray-900"
              style={{ borderRadius: "0.875rem", fontFamily: "var(--font-pixel), monospace" }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="stud-input h-9 text-sm text-gray-900"
              style={{ borderRadius: "0.875rem", fontFamily: "var(--font-pixel), monospace" }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">Icon</label>
            <Input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="📰"
              className="stud-input h-9 text-sm text-gray-900"
              style={{ borderRadius: "0.875rem", fontFamily: "var(--font-pixel), monospace" }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="stud-input flex items-center gap-2 px-4 py-2 text-[10px] uppercase transition-all"
            style={{
              color: "#1e3a5f",
              fontFamily: "var(--font-pixel), monospace",
              borderRadius: "0.875rem",
              background: "rgba(124,179,255,0.6)",
            }}
          >
            <PixelIcon name="plus" size={14} color="#1e3a5f" />
            {saving ? "Saving..." : editingId ? "Update" : "Create"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="stud-input flex items-center gap-2 px-4 py-2 text-[10px] uppercase transition-all"
              style={{
                color: "#374151",
                fontFamily: "var(--font-pixel), monospace",
                borderRadius: "0.875rem",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-black/10"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-black/20 p-3 shadow-sm"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                  backgroundColor: "#ffffff",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: post.gradient || "linear-gradient(135deg, #fbbf24, #f59e0b)",
                      border: "3px solid #1e3a5f",
                      boxShadow: "0 3px 0 0 #1e3a5f",
                    }}
                  >
                    <span className="text-2xl">{post.icon || "📰"}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-bold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {post.title.toUpperCase()}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                      <span>{post.channel}</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="stud-input flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase transition-all"
                    style={{
                      color: "#1e3a5f",
                      fontFamily: "var(--font-pixel), monospace",
                      borderRadius: "0.875rem",
                      background: "rgba(124,179,255,0.6)",
                    }}
                  >
                    <PixelIcon name="switch" size={12} color="#1e3a5f" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="stud-input flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase transition-all"
                    style={{
                      color: "#ef4444",
                      fontFamily: "var(--font-pixel), monospace",
                      borderRadius: "0.875rem",
                    }}
                  >
                    <PixelIcon name="close" size={12} color="#ef4444" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
