## Analytics route: aggregation pipeline

**My own plan first:** I knew from the brief that totals must be calculated
in MongoDB, not in JS. My first idea was three separate aggregate() calls
(one per widget).

**What I asked the AI:**
"I need category-wise valuation, top 10 low-stock products and KPI totals
on 50k documents. Three separate queries or one? What are the trade-offs?"

**What the AI suggested:** a single query using $facet.

**My review / what I questioned:**
- $facet returns one big document, so I checked that the output stays small
  (only 10 products + 8 categories), so the 16MB limit is not a concern here.
- I did not trust it blindly: I compared the totals with a manual count in
  Atlas (totalSKUs = 50,000 matched).

**What I changed:** added $round on money values, and an optional ?category=
filter that I thought of myself for the dashboard.

**Proof:** Postman response time X ms (screenshot in /docs).

## Bug: server crash "argument handler must be a function"
- **Symptom:** nodemon crash on app.use('/api/analytics', ...)
- **My debugging:** read the stack trace, saw server.js:21, checked that
  the route file was exporting nothing.
- **Root cause:** controller file was empty (code never saved).
- **Lesson:** always check module.exports before blaming the framework.