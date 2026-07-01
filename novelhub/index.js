import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

// ─── NovelHub internal API base ────────────────────────────────────────────
const NOVELHUB_BASE_URL = "https://novelhubapp.com/wefeed-h5novel-bff";
const NOVELHUB_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Accept: "application/json",
};

function getErrorMessage(status) {
  const messages = {
    400: "Bad request — parameter tidak valid atau query tidak lengkap.",
    401: "Unauthorized — akses ditolak oleh upstream.",
    403: "Forbidden — akses ditolak.",
    404: "Not found — resource tidak ditemukan.",
    429: "Too many requests — rate limit tercapai.",
    500: "Internal server error — terjadi kesalahan di server.",
    503: "Service unavailable — layanan sedang tidak tersedia.",
  };
  return messages[status] ?? "Terjadi kesalahan yang tidak diketahui.";
}

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (c) => c.html("<h1>ACTIVE!</h1>"));

// ─── GET /api/novelhub?query=KEYWORD — search novel + ambil semua chapter ──
app.get("/api/novelhub", async (c) => {
  const query = c.req.query("query");

  if (!query) {
    return c.json({ error: "Parameter 'query' wajib diisi." }, 400);
  }

  async function fetchJson(url) {
    const res = await fetch(url, { headers: NOVELHUB_HEADERS });
    let json = null;
    try {
      json = await res.json();
    } catch {
      // biarkan null kalau bukan JSON
    }
    return { ok: res.ok, status: res.status, json };
  }

  try {
    // 1) Search novel berdasarkan keyword
    const searchUrl = `${NOVELHUB_BASE_URL}/web/novel/search?page=1&perPage=50&keyword=${encodeURIComponent(query)}&lang=en`;
    const searchRes = await fetchJson(searchUrl);

    if (!searchRes.ok) {
      return c.json({ error: getErrorMessage(searchRes.status) }, searchRes.status);
    }

    const novelList = searchRes.json?.data?.list;

    if (!Array.isArray(novelList) || novelList.length === 0) {
      return c.json({ error: `Novel dengan keyword '${query}' tidak ditemukan.` }, 404);
    }

    const novel = novelList[0];
    const novelId = novel.novelId;
    const novelName = novel.title;
    const author = novel.author ?? null;
    const summary = novel.summary ?? null;
    const score = novel.score ?? null;
    const cover = novel.cover?.url ?? null;

    // 2) Ambil daftar chapter berdasarkan novelId
    const chapterListUrl = `${NOVELHUB_BASE_URL}/web/novel/chapter-list?novelId=${novelId}&order=ASC&lang=en`;
    const chapterRes = await fetchJson(chapterListUrl);

    if (!chapterRes.ok) {
      return c.json({ error: getErrorMessage(chapterRes.status) }, chapterRes.status);
    }

    const rawChapters = chapterRes.json?.data?.chapterList;

    if (!Array.isArray(rawChapters)) {
      return c.json({ error: "Gagal mengambil daftar chapter dari NovelHub." }, 502);
    }

    // 3) Susun jadi struktur JSON yang rapi
    const chapters = rawChapters.map((ch) => ({
      chapterId: ch.chapterId,
      chapterName: ch.chapterName,
      seq: ch.seq,
      totalWords: ch.totalWords,
      fileUrl: ch.fileUrl,
    }));

    return c.json({
      novelId,
      novelName,
      author,
      summary,
      score,
      cover,
      totalChapters: chapters.length,
      chapters,
    });
  } catch (err) {
    console.error("NovelHub fetch error:", err);
    return c.json({ error: "Gagal menghubungi layanan NovelHub." }, 502);
  }
});

// ─── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
serve({ fetch: app.fetch, port: Number(PORT) }, () => {
  console.log(`Server running on port ${PORT}`);
});
