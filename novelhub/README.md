# NovelHub API

Standalone Hono server yang hanya menyediakan satu endpoint:

```
GET /api/novelhub?query=QUERY
```

## Install & Run

```bash
npm install
npm start
```

Server berjalan di `http://localhost:3000` (atau `PORT` dari environment variable).

## Contoh

```
GET /api/novelhub?query=chasing stars
```

Response:
```json
{
  "novelId": "2586530856395230040",
  "novelName": "chasing stars - poetry",
  "author": null,
  "summary": "poems i guess",
  "score": "9.9",
  "cover": "https://nacdn.novelhubapp.com/...",
  "totalChapters": 198,
  "chapters": [
    {
      "chapterId": "267177048299504872",
      "chapterName": "stars",
      "seq": 1,
      "totalWords": 71,
      "fileUrl": "https://nacdn.novelhubapp.com/.../7c26164538c172be1515d477bf3b71e7.txt"
    }
  ]
}
```
