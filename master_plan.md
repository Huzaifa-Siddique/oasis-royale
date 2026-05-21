# Master Plan v2: Oasis Royale (Production Architecture)

## 1. Resilience & User Flow
* **Session Locking:** Middleware must intercept the entry URL. If `table_id` is present, encrypt and store in LocalStorage. All subsequent API calls must pull the ID from storage, not the URL.
* **Order Verification:** Before the final "Place Order" push, the app must perform a "Pre-flight" check to ensure the Kitchen Dashboard is online (using Supabase Realtime 'Presence').

## 2. Advanced Database Schema (Supabase)
### `dishes` (Read-Only for Public)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `is_available`| bool | DEFAULT true (For out-of-stock items) |
| `metadata` | jsonb | For calorie info, allergens, etc. |

### `orders` (Strict RLS)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `order_short_id`| int | Generated (e.g., #102) for easy verbal use |
| `session_id` | uuid | To group multiple items from one phone |
| `status` | enum | [pending, processing, ready, completed, cancelled] |
| `cancellation` | jsonb | { "reason": string, "by": staff_id, "time": timestamp } |

## 3. Real-time Kitchen Operations
* **Push Notifications:** Use 'Web Push API' or 'Supabase Realtime' to trigger a high-frequency audio alert in the kitchen.
* **The "Reason" Logic:** Mandatory "Reason" field for status 'cancelled'. This data must feed into a 'Wastage Report' in the Admin Dashboard.
* **Daily Reconciliation:** Automatic Cron job at 2 AM to archive 'Completed' orders and reset the 'Daily Total' counter.

## 4. Admin Strategy
* **Route:** `/admin/auth` -> `/admin/dashboard`.
* **Access:** Only specific 'Service Role' keys or authenticated Staff emails can access the revenue charts.
* **Analytics:** 1. **Heatmap:** Which table is ordering the most?
    2. **Performance:** Average time from 'Pending' to 'Served'.

