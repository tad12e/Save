# Intent Detection Feature Specification

> **Goal**: Organize content by **WHY** the user saved it (Action Intent), not just **WHAT** format it is (File Type).

---

## 1. The 7 Action Intents

| Intent | Meaning | Examples | Smart Action Button |
| :--- | :--- | :--- | :--- |
| 🎯 **`apply`** | Anything requiring an application before a deadline | Job postings, scholarships, grants, fellowships, accelerators | ⏳ **"Deadline: Date"** • *[Open Application]* |
| 📚 **`learn`** | Knowledge to study, comprehend, or reference | Tutorials, system design guides, books, deep dives, papers | ⏱️ **"X min read"** • *[Mark as Read]* |
| 🛒 **`buy`** | Products, software subscriptions, deals | Hardware, SaaS pricing, Black Friday discounts, Amazon items | 🏷️ **"View Pricing / Deal"** |
| 🗓️ **`attend`** | Events or live streams happening at a calendar time | Hackathons, webinars, Twitter Spaces, conferences, meetups | 📅 **[Add to Google Calendar]** |
| 🤝 **`hire`** | Finding talent or people to recruit | Designer portfolios (Dribbble), dev GitHubs, freelancers | ✉️ **[Contact / View Portfolio]** |
| 📈 **`track`** | Market intelligence, competitor updates, metrics | Competitor launch announcements, quarterly earnings, trends | 📊 **"Tagged: Competitor Intel"** |
| 📌 **`other`** | General bookmarks, inspiration, memes | Quotes, aesthetic visual edits, personal bookmarks | 🔖 **[Standard Bookmark]** |

---

## 2. Implementation Blueprint

### Step 1: Database Model (`backend/apps/clips/models.py`)
```python
INTENT_CHOICES = [
    ('apply', 'Apply'),
    ('learn', 'Learn'),
    ('buy', 'Buy'),
    ('attend', 'Attend'),
    ('hire', 'Hire'),
    ('track', 'Track'),
    ('other', 'Other'),
]

intent = models.CharField(
    max_length=20, 
    choices=INTENT_CHOICES, 
    default='other', 
    db_index=True
)
```

### Step 2: Instant Rule Heuristics (`backend/apps/clips/services/intent_detector.py`)
Synchronous 0ms detection based on keywords and domains:
* `greenhouse.io`, `lever.co`, `workday.com` → `apply`
* `amazon.com`, `shopify.com`, `gumroad.com` → `buy`
* Text contains `rsvp`, `register now`, `hackathon` → `attend`
* Text contains `we are hiring`, `portfolio`, `freelancer` → `hire`
* Content type in `course`, `book`, `programming` → `learn`

### Step 3: Generative AI Inference (`backend/apps/clips/services/summarize.py`)
Add `intent` field to `ClipSummarySchema`:
```python
class ClipSummarySchema(BaseModel):
    summary: str
    category_name: str
    content_type: str
    intent: Literal['apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other'] = Field(
        description="Infer why the user saved this: 'apply' (jobs/grants), 'learn' (guides/papers), 'buy' (products/deals), 'attend' (events/webinars), 'hire' (talent/candidates), 'track' (news/updates), or 'other'"
    )
```

### Step 4: API Endpoints (`backend/apps/clips/views.py`)
* Filter query: `GET /api/clips/?intent=apply`
* Dashboard breakdown: `qs.values('intent').annotate(count=Count('id')).order_by('-count')`

### Step 5: Frontend UI (Web & Mobile)
Replace format-only filter tabs with **Intent Action Tabs**:
`[All (53)]  [🎯 Apply (14)]  [📚 Learn (32)]  [🛒 Buy (4)]  [🗓️ Attend (3)]`
