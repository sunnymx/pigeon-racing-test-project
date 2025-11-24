# PostGIS Teaching Guide

**Last Updated:** 2025-11-14
**Technology Version:** PostGIS 3.x, PostgreSQL 12+
**Reading Time:** 15-20 minutes

---

## Overview (5-min read)

**What is PostGIS?**

PostgreSQL extension for storing, indexing, and querying spatial/geographic data (points, lines, polygons, trajectories).

**When to use:**
- Storing GPS coordinates, tracks, or map boundaries
- Finding nearest locations or objects within a radius
- Spatial analysis (intersections, distances, containment)

**Core concepts:**
1. **Geography vs Geometry** - Accuracy (meters on Earth) vs Performance (2D plane)
2. **ST_Distance vs ST_DWithin** - Calculate exact distance vs filter by radius
3. **GIST Index** - Spatial indexing for blazing fast queries

**Quick Example:**

```sql
-- Find all GPS points within 500m of a location
SELECT pigeon_number, timestamp, ST_AsText(geom)
FROM track_points
WHERE ST_DWithin(
    geom::geography,
    ST_MakePoint(121.5, 25.0)::geography,
    500  -- meters
);
```

**Decision Tree:**
- Filtering within radius? → Use `ST_DWithin` + geography
- Need exact distance? → Use `ST_Distance` + geography
- Nearest N objects? → Use KNN operator `<->` + geometry
- Complex spatial operations? → Use geometry + projections

---

## Deep Dive (15-min read)

### Concept 1: Geography vs Geometry

**Problem it solves:** GPS coordinates are on Earth's curved surface. Geography gives accurate meters, Geometry gives fast 2D plane calculations.

**Code Example:**

```sql
-- ❌ WRONG: Geometry returns degree units (meaningless)
SELECT ST_Distance(ST_MakePoint(121.5, 25.0), ST_MakePoint(121.6, 25.1));
-- Result: 0.141 (degrees)

-- ✅ CORRECT: Geography returns meters
SELECT ST_Distance(
    ST_MakePoint(121.5, 25.0)::geography,
    ST_MakePoint(121.6, 25.1)::geography
);
-- Result: 15647.39 (meters)
```

**When to use:**
- **Geography**: Distance calculations, accuracy matters
- **Geometry**: With GIST index for filtering

**Common mistakes:**
- ❌ Forgetting ::geography cast → Returns degrees
- ✅ Store as geometry, cast to geography in queries

---

### Concept 2: ST_Distance vs ST_DWithin

**Problem it solves:** ST_Distance calculates exact distance (slow). ST_DWithin filters "within X meters" (fast with index).

**Code Example:**

```sql
-- ❌ SLOW: Full table scan
SELECT * FROM track_points
WHERE ST_Distance(geom::geography, ST_MakePoint(121.5, 25.0)::geography) < 500;

-- ✅ FAST: Uses GIST index (100x faster)
SELECT * FROM track_points
WHERE ST_DWithin(geom::geography, ST_MakePoint(121.5, 25.0)::geography, 500);

-- ✅ BEST: Filter with ST_DWithin, show exact distance with ST_Distance
SELECT pigeon_number,
       ST_Distance(geom::geography, ST_MakePoint(121.5, 25.0)::geography) AS distance_m
FROM track_points
WHERE ST_DWithin(geom::geography, ST_MakePoint(121.5, 25.0)::geography, 500)
ORDER BY distance_m;
```

**Common mistakes:**
- ❌ Using ST_Distance in WHERE → Bypasses index
- ✅ Use ST_DWithin for WHERE, ST_Distance for SELECT

---

### Concept 3: GIST Index

**Problem it solves:** Without index, PostGIS checks every row (slow). With GIST index, skips 99% of rows (100x faster).

**Code Example:**

```sql
-- Create GIST index on geometry column (CRITICAL for performance)
CREATE INDEX idx_track_points_geom ON track_points USING GIST (geom);

-- Verify index usage
EXPLAIN ANALYZE
SELECT * FROM track_points
WHERE ST_DWithin(geom::geography, ST_MakePoint(121.5, 25.0)::geography, 500);
-- Should show "Index Scan using idx_track_points_geom"
```

**Common mistakes:**
- ❌ No index on spatial column → All queries slow
- ❌ Index on geography type → Won't work! Index geometry only
- ✅ Index geometry, cast to geography in queries

---

## Best Practices Checklist

- [ ] **Always cast to ::geography for distance calculations** - Ensures meter units
- [ ] **Create GIST index on geometry columns** - Essential for performance
- [ ] **Use ST_DWithin for filtering, ST_Distance for results** - Optimal query pattern
- [ ] **Store as geometry, cast to geography** - Enables spatial indexing
- [ ] **Use ST_MakePoint(lon, lat)** - Note: longitude first, then latitude!

---

## Troubleshooting

### Issue 1: Distance Returns 0.05 instead of 5000 (Degree Units)

**Cause:** Missing ::geography cast
**Solution:**
```sql
SELECT ST_Distance(geom::geography, ST_MakePoint(121.5, 25.0)::geography) AS distance_m;
```

---

### Issue 2: Spatial Queries Are Slow

**Cause:** Missing GIST index or using ST_Distance in WHERE
**Solution:**
```sql
CREATE INDEX idx_track_points_geom ON track_points USING GIST (geom);
SELECT * FROM track_points
WHERE ST_DWithin(geom::geography, ST_MakePoint(121.5, 25.0)::geography, 500);
```

---

### Issue 3: Coordinates Appear in Wrong Location

**Cause:** PostGIS uses (longitude, latitude) order
**Solution:**
```sql
-- ✅ CORRECT: Longitude first, latitude second
ST_MakePoint(121.5, 25.0)  -- Taiwan
```

---

## Further Learning

**Official Documentation:**
- [PostGIS Manual](https://postgis.net/docs/)
- [PostGIS Functions Reference](https://postgis.net/docs/reference.html)

**Related Topics:**
- FastAPI + PostGIS Integration - See `teaching-fastapi.md`
- Advanced Spatial Queries - [Coming in Phase 2]

---

**Last Updated:** 2025-11-14
**Maintainer:** Teaching System
