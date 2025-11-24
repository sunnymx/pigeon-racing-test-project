# PostgreSQL + PostGIS Patterns

## Table of Contents

1. [Overview](#1-overview)
2. [Current Project Patterns](#2-current-project-patterns)
3. [Connection Pooling](#3-connection-pooling)
4. [Repository Pattern](#4-repository-pattern)
5. [Transaction Management](#5-transaction-management)
6. [PostGIS Spatial Queries](#6-postgis-spatial-queries)
7. [Query Optimization](#7-query-optimization)
8. [Common Pitfalls](#8-common-pitfalls)
9. [Project Integration](#9-project-integration)
10. [Reference Links](#10-reference-links)

---

## 1. Overview

This guide covers PostgreSQL database patterns and PostGIS spatial operations for Python/FastAPI applications. It focuses on:

- **Connection management**: Pool configuration and lifecycle
- **Repository pattern**: Domain-specific data access layers
- **Spatial operations**: PostGIS queries for trajectory analysis
- **Performance optimization**: Indexing and query strategies
- **Production patterns**: Transaction handling and error recovery

**Project Context**: The pigeon racing trajectory filter system uses PostgreSQL 18.x with PostGIS 3.x for storing and analyzing GPS track data with spatial operations.

---

## 2. Current Project Patterns

### 2.1 Database Class (Connection Management)

Current implementation in `src/db/database.py`:

```python
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from contextlib import contextmanager
import os

class Database:
    """Database connection management"""

    def __init__(self):
        self.connection_params = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'track_filter'),
            'user': os.getenv('DB_USER', 'tf')
        }
        # Only add password if it's set
        password = os.getenv('DB_PASSWORD')
        if password:
            self.connection_params['password'] = password

    @contextmanager
    def get_connection(self):
        """Get database connection (context manager)"""
        conn = psycopg2.connect(**self.connection_params)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def execute(self, sql: str, params: tuple = None) -> None:
        """Execute SQL (INSERT, UPDATE, DELETE)"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)

    def query(self, sql: str, params: tuple = None) -> List[Dict]:
        """Query SQL (SELECT)"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params)
                return [dict(row) for row in cur.fetchall()]

    def query_one(self, sql: str, params: tuple = None) -> Optional[Dict]:
        """Query single record"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params)
                row = cur.fetchone()
                return dict(row) if row else None

    def insert_returning_id(self, sql: str, params: tuple = None) -> int:
        """Insert and return ID"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchone()[0]
```

**Key Features**:
- Environment-based configuration
- Context manager for automatic commit/rollback
- RealDictCursor for dict-based results
- Separate methods for queries vs. commands

**Limitations**:
- No connection pooling (creates new connection per request)
- Synchronous only (no async support)
- No transaction isolation level control

### 2.2 TrackRepository (Domain-Specific Queries)

Current implementation with PostGIS operations:

```python
class TrackRepository:
    """Track data access layer"""

    def __init__(self, db: Database):
        self.db = db

    def get_race_tracks(self, race_id: int) -> List[Dict]:
        """Get all tracks for a race"""
        sql = """
            SELECT
                t.id,
                t.pigeon_number,
                t.pigeon_name,
                t.total_points,
                COUNT(tp.id) as point_count
            FROM tracks t
            LEFT JOIN track_points tp ON t.id = tp.track_id
            WHERE t.race_id = %s
            GROUP BY t.id
            ORDER BY t.id
        """
        return self.db.query(sql, (race_id,))

    def get_track_points(self, track_id: int) -> List[Dict]:
        """Get track points with auxiliary fields"""
        sql = """
            SELECT
                id, timestamp, latitude, longitude, altitude,
                speed, hdop, moving_speed, altitude_agl,
                wing_flaps_per_sec, vibration_amplitude,
                wing_beat_amplitude, is_stationary, acceleration,
                on_highway, highway_name, terrain_type,
                elevation_dem, anomaly_flags
            FROM track_points
            WHERE track_id = %s
            ORDER BY timestamp
        """
        return self.db.query(sql, (track_id,))

    def batch_update_geo_features(self, track_id: int):
        """Batch update geographic features (using PostGIS)"""
        # Update highway proximity
        sql_highway = """
            UPDATE track_points tp
            SET
                on_highway = COALESCE(
                    (SELECT TRUE
                     FROM highways h
                     WHERE ST_DWithin(tp.geom::geography, h.geom::geography, 20)
                     LIMIT 1),
                    FALSE
                ),
                highway_name = (
                    SELECT h.name
                    FROM highways h
                    WHERE ST_DWithin(tp.geom::geography, h.geom::geography, 20)
                    ORDER BY ST_Distance(tp.geom::geography, h.geom::geography)
                    LIMIT 1
                )
            WHERE tp.track_id = %s
        """
        self.db.execute(sql_highway, (track_id,))

        # Update terrain elevation
        sql_elevation = """
            UPDATE track_points tp
            SET
                elevation_dem = (
                    SELECT d.elevation
                    FROM dem_tiles d
                    WHERE ST_Contains(d.geom, tp.geom)
                    LIMIT 1
                ),
                altitude_agl = CASE
                    WHEN tp.altitude IS NOT NULL
                        AND (SELECT d.elevation FROM dem_tiles d
                             WHERE ST_Contains(d.geom, tp.geom) LIMIT 1) IS NOT NULL
                    THEN tp.altitude - (SELECT d.elevation FROM dem_tiles d
                                       WHERE ST_Contains(d.geom, tp.geom) LIMIT 1)
                    ELSE NULL
                END
            WHERE tp.track_id = %s
        """
        self.db.execute(sql_elevation, (track_id,))
```

**PostGIS Operations Used**:
- `ST_DWithin(geom::geography, geom::geography, distance)` - Distance check in meters
- `ST_Distance(geom::geography, geom::geography)` - Calculate distance in meters
- `ST_Contains(polygon, point)` - Point-in-polygon test

**Performance Notes**:
- Uses geography cast for accurate meter-based distances
- LIMIT 1 optimization for nearest neighbor queries
- Separate queries to avoid subquery repetition (could be optimized with CTE)

### 2.3 Batch Update Pattern

Optimized batch update using `execute_values`:

```python
from psycopg2.extras import execute_values

def batch_update_auxiliary_fields(self, track_id: int, points: List[Dict]) -> None:
    """
    Batch update auxiliary fields (single SQL statement)

    Performance: 10-50x faster than row-by-row updates
    Uses UPDATE ... FROM (VALUES ...) syntax

    Args:
        track_id: Track ID
        points: List of points with calculated auxiliary fields
    """
    if not points:
        return

    # Build VALUES list
    values_list = []
    for point in points:
        values_list.append((
            point['id'],
            point.get('moving_speed'),
            point.get('altitude_agl'),
            point.get('wing_flaps_per_sec'),
            point.get('vibration_amplitude'),
            point.get('wing_beat_amplitude'),
            point.get('is_stationary'),
            point.get('acceleration'),
            point.get('on_highway'),
            Json(point.get('anomaly_flags', {}))
        ))

    # Batch UPDATE (with type casting)
    sql = """
        UPDATE track_points AS tp
        SET
            moving_speed = v.moving_speed::float,
            altitude_agl = v.altitude_agl::float,
            wing_flaps_per_sec = v.wing_flaps_per_sec::float,
            vibration_amplitude = v.vibration_amplitude::float,
            wing_beat_amplitude = v.wing_beat_amplitude::float,
            is_stationary = v.is_stationary::boolean,
            acceleration = v.acceleration::float,
            on_highway = v.on_highway::boolean,
            anomaly_flags = v.anomaly_flags::jsonb,
            auxiliary_computed_at = NOW(),
            auxiliary_version = 'v1.1'
        FROM (VALUES %s) AS v(
            point_id, moving_speed, altitude_agl, wing_flaps_per_sec,
            vibration_amplitude, wing_beat_amplitude,
            is_stationary, acceleration, on_highway, anomaly_flags
        )
        WHERE tp.id = v.point_id::bigint
    """

    # Execute batch update
    with self.db.get_connection() as conn:
        with conn.cursor() as cur:
            execute_values(cur, sql, values_list, page_size=500)
```

**Why This Is Fast**:
- Single round-trip to database
- PostgreSQL optimizes VALUES clause internally
- page_size=500 balances memory vs. network overhead

---

## 3. Connection Pooling

### 3.1 psycopg2 vs psycopg3 Comparison

**Performance Benchmarks**:
- **Psycopg3**: ~1.2M rows/sec (2x faster than psycopg2)
- **Psycopg3 Async**: Slightly better than sync version
- **asyncpg**: Fastest overall, but PostgreSQL-specific

**Current Project**: Uses psycopg2-binary (no pooling)

**Recommended Upgrade**: Psycopg3 with AsyncConnectionPool

### 3.2 Psycopg3 AsyncConnectionPool (Recommended)

**Installation**:
```bash
pip install psycopg[pool]  # Includes async support
```

**Setup with FastAPI Lifespan**:

```python
# app/db/connection.py
from psycopg_pool import AsyncConnectionPool
from contextlib import asynccontextmanager
from fastapi import FastAPI

# Global connection pool (initialized at startup)
db_pool: AsyncConnectionPool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage connection pool lifecycle with FastAPI lifespan"""
    global db_pool

    # Startup: Create pool
    db_pool = AsyncConnectionPool(
        conninfo="postgresql://user:pass@localhost/dbname",
        min_size=5,
        max_size=20,
        timeout=30,
        max_idle=300,  # Close idle connections after 5 minutes
        max_lifetime=3600,  # Recycle connections after 1 hour
    )

    # Wait for pool to be ready
    await db_pool.wait()

    print(f"Database pool created: {db_pool.name}")

    yield  # Application runs

    # Shutdown: Close pool
    await db_pool.close()
    print("Database pool closed")

# app/main.py
app = FastAPI(lifespan=lifespan)

# Dependency to get connection from pool
async def get_db_connection():
    """Get connection from pool for a single request"""
    async with db_pool.connection() as conn:
        yield conn
```

**Usage in Routes**:
```python
from fastapi import Depends
from psycopg import AsyncConnection

@app.get("/tracks/{race_id}")
async def get_tracks(
    race_id: int,
    conn: AsyncConnection = Depends(get_db_connection)
):
    async with conn.cursor() as cur:
        await cur.execute(
            "SELECT * FROM tracks WHERE race_id = %s",
            (race_id,)
        )
        rows = await cur.fetchall()
        return [dict(row) for row in rows]
```

### 3.3 psycopg2 ThreadedConnectionPool (Legacy)

If staying with psycopg2, use ThreadedConnectionPool:

```python
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager

class Database:
    def __init__(self):
        self.pool = ThreadedConnectionPool(
            minconn=5,
            maxconn=20,
            host="localhost",
            port=5432,
            database="track_filter",
            user="postgres",
            password="postgres"
        )

    @contextmanager
    def get_connection(self):
        """Get connection from pool (sync)"""
        conn = self.pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self.pool.putconn(conn)

    def close(self):
        """Close all connections in pool"""
        self.pool.closeall()

# Initialize once
db = Database()

@app.on_event("shutdown")
def shutdown():
    db.close()
```

**Configuration Guidelines**:
- `minconn`: Number of CPU cores (e.g., 4-8)
- `maxconn`: 2-3x CPU cores (e.g., 16-24)
- Rule of thumb: `max_connections` in PostgreSQL should be >= maxconn * number_of_workers

---

## 4. Repository Pattern

### 4.1 Generic Base Repository

```python
# app/repositories/base.py
from typing import TypeVar, Generic, Type, Optional, List
from pydantic import BaseModel
from psycopg import AsyncConnection

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations"""

    def __init__(self, model: Type[ModelType], conn: AsyncConnection):
        self.model = model
        self.conn = conn

    async def get(self, id: int) -> Optional[ModelType]:
        """Get single record by ID"""
        async with self.conn.cursor() as cur:
            await cur.execute(
                f"SELECT * FROM {self.table_name} WHERE id = %s",
                (id,)
            )
            row = await cur.fetchone()
            return self.model(**dict(row)) if row else None

    async def list(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> List[ModelType]:
        """List records with pagination"""
        async with self.conn.cursor() as cur:
            await cur.execute(
                f"SELECT * FROM {self.table_name} LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
            return [self.model(**dict(row)) for row in rows]

    async def create(self, obj: ModelType) -> ModelType:
        """Create new record"""
        data = obj.model_dump(exclude={'id'})
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))

        async with self.conn.cursor() as cur:
            await cur.execute(
                f"INSERT INTO {self.table_name} ({columns}) "
                f"VALUES ({placeholders}) RETURNING id",
                tuple(data.values())
            )
            new_id = (await cur.fetchone())[0]
            await self.conn.commit()
            return await self.get(new_id)

    async def update(self, id: int, obj: ModelType) -> Optional[ModelType]:
        """Update existing record"""
        data = obj.model_dump(exclude={'id'}, exclude_unset=True)
        set_clause = ', '.join([f"{k} = %s" for k in data.keys()])

        async with self.conn.cursor() as cur:
            await cur.execute(
                f"UPDATE {self.table_name} SET {set_clause} WHERE id = %s",
                (*data.values(), id)
            )
            await self.conn.commit()
            return await self.get(id)

    async def delete(self, id: int) -> bool:
        """Delete record"""
        async with self.conn.cursor() as cur:
            await cur.execute(
                f"DELETE FROM {self.table_name} WHERE id = %s",
                (id,)
            )
            deleted = cur.rowcount > 0
            await self.conn.commit()
            return deleted
```

### 4.2 Domain-Specific Repository

```python
# app/repositories/track_repo.py
from app.repositories.base import BaseRepository
from app.models.track import Track
from typing import List, Optional

class TrackRepository(BaseRepository[Track]):
    table_name = "tracks"

    async def get_by_race(self, race_id: int) -> List[Track]:
        """Get all tracks for a race"""
        async with self.conn.cursor() as cur:
            await cur.execute(
                "SELECT * FROM tracks WHERE race_id = %s ORDER BY id",
                (race_id,)
            )
            rows = await cur.fetchall()
            return [Track(**dict(row)) for row in rows]

    async def get_with_points(self, track_id: int) -> Optional[dict]:
        """Get track with all points (PostGIS example)"""
        async with self.conn.cursor() as cur:
            await cur.execute("""
                SELECT
                    t.*,
                    json_agg(
                        json_build_object(
                            'id', tp.id,
                            'timestamp', tp.timestamp,
                            'latitude', ST_Y(tp.geom::geometry),
                            'longitude', ST_X(tp.geom::geometry),
                            'altitude', tp.altitude,
                            'moving_speed', tp.moving_speed
                        ) ORDER BY tp.timestamp
                    ) as points
                FROM tracks t
                LEFT JOIN track_points tp ON tp.track_id = t.id
                WHERE t.id = %s
                GROUP BY t.id
            """, (track_id,))

            row = await cur.fetchone()
            return dict(row) if row else None

    async def get_suspicious_tracks(
        self,
        race_id: int,
        min_confidence: float = 0.7
    ) -> List[Track]:
        """Get tracks with suspicious segments above threshold"""
        async with self.conn.cursor() as cur:
            await cur.execute("""
                SELECT DISTINCT t.*
                FROM tracks t
                JOIN filter_result_details frd ON frd.track_id = t.id
                WHERE t.race_id = %s
                  AND frd.confidence_score >= %s
                ORDER BY t.id
            """, (race_id, min_confidence))

            rows = await cur.fetchall()
            return [Track(**dict(row)) for row in rows]
```

**Design Benefits**:
- Type safety with Generic[ModelType]
- Reusable CRUD operations
- Domain-specific methods in subclasses
- Easy to test (mock AsyncConnection)

---

## 5. Transaction Management

### 5.1 Unit of Work Pattern

```python
# app/db/unit_of_work.py
from typing import Optional
from psycopg import AsyncConnection

class UnitOfWork:
    """
    Manages transaction boundaries across multiple repositories.
    Ensures all-or-nothing commits.
    """

    def __init__(self, conn: AsyncConnection):
        self.conn = conn
        self._in_transaction = False

    async def __aenter__(self):
        """Start transaction"""
        await self.conn.execute("BEGIN")
        self._in_transaction = True
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Commit or rollback based on exceptions"""
        if exc_type is not None:
            await self.rollback()
        else:
            await self.commit()

    async def commit(self):
        """Commit transaction"""
        if self._in_transaction:
            await self.conn.execute("COMMIT")
            self._in_transaction = False

    async def rollback(self):
        """Rollback transaction"""
        if self._in_transaction:
            await self.conn.execute("ROLLBACK")
            self._in_transaction = False

# Usage in service layer
async def create_race_with_tracks(
    race_data: RaceCreate,
    tracks_data: List[TrackCreate],
    conn: AsyncConnection
):
    """
    Create race and multiple tracks in a single transaction.
    If any track fails, entire operation rolls back.
    """
    async with UnitOfWork(conn):
        race_repo = RaceRepository(conn)
        track_repo = TrackRepository(conn)

        # Create race
        race = await race_repo.create(race_data)

        # Create all tracks
        tracks = []
        for track_data in tracks_data:
            track_data.race_id = race.id
            track = await track_repo.create(track_data)
            tracks.append(track)

        return {"race": race, "tracks": tracks}
```

### 5.2 Transactional Decorator

```python
from functools import wraps

def transactional(func):
    """
    Decorator to wrap async function in transaction.
    Similar to Spring's @Transactional.
    """
    @wraps(func)
    async def wrapper(self, *args, **kwargs):
        async with self.conn.transaction():
            return await func(self, *args, **kwargs)
    return wrapper

# Usage
class TrackService:
    def __init__(self, track_repo: TrackRepository):
        self.track_repo = track_repo

    @transactional
    async def update_track_and_recalculate(
        self,
        track_id: int,
        updates: TrackUpdate
    ):
        """Update track and recalculate all auxiliary fields"""
        # All operations in single transaction
        track = await self.track_repo.update(track_id, updates)
        await self.track_repo.recalculate_auxiliary(track_id)
        return track
```

---

## 6. PostGIS Spatial Queries

### 6.1 Geography vs Geometry Decision Matrix

| Use Case | Recommendation | Reason |
|----------|----------------|--------|
| Global/continental data | Geography | Accurate over long distances |
| Regional/city data | Geometry (projected) | Faster, accurate enough locally |
| Distance in meters | Geography | Built-in metric units |
| Complex spatial ops | Geometry | More functions available |
| High performance needed | Geometry | ~2x faster calculations |

**Project Recommendation**: Use **Geography** for pigeon racing trajectories (cross-country distances, need meter precision).

### 6.2 ST_DWithin for Proximity Queries

**Example: Find track points near highways**

```python
async def find_tracks_near_highway(
    race_id: int,
    distance_meters: float = 20.0
) -> List[dict]:
    """
    Find track points within 20m of highways.
    Uses geography for accurate meter-based distance.
    """
    async with conn.cursor() as cur:
        await cur.execute("""
            SELECT
                tp.track_id,
                tp.id as point_id,
                tp.timestamp,
                ST_Y(tp.geom::geometry) as lat,
                ST_X(tp.geom::geometry) as lon,
                ST_Distance(
                    tp.geom::geography,
                    hw.geom::geography
                ) as distance_meters
            FROM track_points tp
            JOIN tracks t ON t.id = tp.track_id
            CROSS JOIN LATERAL (
                SELECT geom
                FROM highways
                WHERE ST_DWithin(
                    tp.geom::geography,
                    highways.geom::geography,
                    %s  -- distance in meters
                )
                ORDER BY tp.geom::geography <-> highways.geom::geography
                LIMIT 1
            ) hw
            WHERE t.race_id = %s
              AND tp.geom IS NOT NULL
        """, (distance_meters, race_id))

        return [dict(row) for row in await cur.fetchall()]
```

**Key Points**:
- `ST_DWithin(geom::geography, geom::geography, distance_meters)` uses spatial index
- `CROSS JOIN LATERAL` finds nearest highway for each point
- `<->` operator (distance) for ordering nearest neighbor
- Geography cast ensures meter-based distance

### 6.3 Hybrid Approach (Geometry Column + Geography Index)

**Schema Design**:

```sql
-- Create table with geometry column
CREATE TABLE track_points (
    id SERIAL PRIMARY KEY,
    track_id INTEGER REFERENCES tracks(id),
    timestamp TIMESTAMP,
    geom GEOMETRY(Point, 4326),  -- WGS84
    -- other fields...
);

-- Create GIST index on geometry
CREATE INDEX idx_track_points_geom
ON track_points
USING GIST (geom);

-- Create functional index for geography operations
CREATE INDEX idx_track_points_geog
ON track_points
USING GIST (CAST(geom AS geography));
```

**Why This Works**:
- Store as geometry (smaller, faster)
- Cast to geography only for distance calculations
- Functional index supports geography queries
- PostgreSQL query planner chooses appropriate index

### 6.4 Bounding Box Queries

**Example: Get points in bounding box**

```python
async def get_points_in_bounding_box(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float
) -> List[dict]:
    """
    Get points in bounding box.
    Uses spatial index automatically.
    """
    async with conn.cursor() as cur:
        await cur.execute("""
            SELECT
                id,
                ST_Y(geom) as latitude,
                ST_X(geom) as longitude,
                altitude
            FROM track_points
            WHERE geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)
              AND ST_Within(
                  geom,
                  ST_MakeEnvelope(%s, %s, %s, %s, 4326)
              )
        """, (min_lon, min_lat, max_lon, max_lat,
              min_lon, min_lat, max_lon, max_lat))

        return [dict(row) for row in await cur.fetchall()]
```

**Why Two Checks**:
1. `geom && envelope` - Fast bounding box check (index scan)
2. `ST_Within(geom, envelope)` - Exact check (filters false positives)

### 6.5 Distance Calculations

**Example: Calculate segment distance**

```python
async def calculate_segment_distance(
    track_id: int,
    start_point_id: int,
    end_point_id: int
) -> float:
    """Calculate distance between two points in meters"""
    async with conn.cursor() as cur:
        await cur.execute("""
            SELECT ST_Distance(
                p1.geom::geography,
                p2.geom::geography
            ) as distance_meters
            FROM track_points p1, track_points p2
            WHERE p1.track_id = %s
              AND p1.id = %s
              AND p2.track_id = %s
              AND p2.id = %s
        """, (track_id, start_point_id, track_id, end_point_id))

        result = await cur.fetchone()
        return result['distance_meters'] if result else 0.0
```

---

## 7. Query Optimization

### 7.1 GIST Index Best Practices

**Basic GIST Index**:
```sql
CREATE INDEX idx_track_points_geom
ON track_points
USING GIST (geom);
```

**For Geography Type**:
```sql
CREATE INDEX idx_track_points_geog
ON track_points
USING GIST (CAST(geom AS geography));
```

**Partial Index (for specific race)**:
```sql
CREATE INDEX idx_track_points_geom_race1
ON track_points
USING GIST (geom)
WHERE track_id IN (
    SELECT id FROM tracks WHERE race_id = 1
);
```

**Index with FILLFACTOR (for frequent updates)**:
```sql
CREATE INDEX idx_track_points_geom
ON track_points
USING GIST (geom)
WITH (fillfactor = 80);  -- Leave 20% room for updates
```

### 7.2 Index Maintenance

**After Bulk Operations**:

```python
async def maintain_spatial_indexes(table_name: str):
    """
    Maintain spatial indexes after bulk operations.
    Run after: large inserts, updates, or deletes.
    """
    async with conn.cursor() as cur:
        # Vacuum to reclaim space
        await cur.execute(f"VACUUM ANALYZE {table_name}")

        # Reindex if needed (rarely necessary)
        # await cur.execute(f"REINDEX TABLE {table_name}")
```

### 7.3 Performance Monitoring

**Check Index Usage**:

```python
async def check_index_usage(table_name: str = "track_points"):
    """Check if spatial indexes are being used"""
    async with conn.cursor() as cur:
        await cur.execute("""
            SELECT
                schemaname,
                tablename,
                indexname,
                idx_scan as index_scans,
                idx_tup_read as tuples_read,
                idx_tup_fetch as tuples_fetched
            FROM pg_stat_user_indexes
            WHERE tablename = %s
              AND indexname LIKE '%%geom%%'
            ORDER BY idx_scan DESC
        """, (table_name,))

        return [dict(row) for row in await cur.fetchall()]
```

### 7.4 Spatial Function Performance

| Function | Use Case | Performance Notes |
|----------|----------|-------------------|
| ST_Contains | Point-in-polygon | Pre-filters with `~` operator, faster for containment checks |
| ST_Intersects | Overlapping geometries | Pre-filters with `&&` operator, more candidates to check |
| ST_DWithin | Distance queries | Uses index + distance calculation, add explicit radius limit |
| ST_Within | Opposite of Contains | Same performance as ST_Contains |
| ST_Distance | Distance calculation | Does NOT use index, use ST_DWithin for filtering first |

### 7.5 Query Optimization Example

**Optimize Large Polygon Queries**:

```python
async def find_points_in_region(region_wkt: str) -> List[dict]:
    """
    Find points in complex region.
    Optimization: Use ST_Subdivide for large polygons.
    """
    async with conn.cursor() as cur:
        await cur.execute("""
            -- For large polygons, subdivide first
            WITH subdivided AS (
                SELECT ST_Subdivide(
                    ST_GeomFromText(%s, 4326),
                    256  -- max vertices per subdivision
                ) as geom
            )
            SELECT
                tp.id,
                ST_Y(tp.geom) as lat,
                ST_X(tp.geom) as lon
            FROM track_points tp
            CROSS JOIN subdivided s
            WHERE ST_Contains(s.geom, tp.geom)
        """, (region_wkt,))

        return [dict(row) for row in await cur.fetchall()]
```

**Why ST_Subdivide Helps**:
- Breaks large polygons into smaller pieces
- Each piece uses spatial index more efficiently
- Reduces false positives in bounding box pre-filtering

---

## 8. Common Pitfalls

### 8.1 Type Mixing (Geography/Geometry Casting)

**WRONG: Casting in tight loops**
```python
# KILLS PERFORMANCE: Cast on every row
await cur.execute("""
    SELECT *
    FROM track_points
    WHERE ST_DWithin(
        geom::geography,        -- Cast on every row!
        ST_Point(%s, %s)::geography,
        1000
    )
""", (lon, lat))
```

**CORRECT: Use consistent types**
```python
# Option 1: Store as geography
await cur.execute("""
    SELECT *
    FROM track_points
    WHERE ST_DWithin(geom, ST_Point(%s, %s)::geography, 1000)
""", (lon, lat))

# Option 2: Use functional geography index (see Section 6.3)
```

### 8.2 Skipping VACUUM ANALYZE

**WRONG: Skip maintenance after bulk operations**
```python
await bulk_insert_points(points)
# Queries will be slow!
```

**CORRECT: Maintain statistics**
```python
await bulk_insert_points(points)
await conn.execute("VACUUM ANALYZE track_points")
```

### 8.3 Using ST_Distance Instead of ST_DWithin

**WRONG: ST_Distance doesn't use index**
```python
await cur.execute("""
    SELECT * FROM track_points
    WHERE ST_Distance(geom::geography, ST_Point(%s, %s)::geography) < 1000
""", (lon, lat))
```

**CORRECT: ST_DWithin uses index**
```python
await cur.execute("""
    SELECT * FROM track_points
    WHERE ST_DWithin(geom::geography, ST_Point(%s, %s)::geography, 1000)
""", (lon, lat))
```

### 8.4 Creating New Connections Per Request

**WRONG: New connection every time**
```python
@app.get("/tracks")
async def get_tracks():
    conn = await psycopg.AsyncConnection.connect("postgresql://...")
    # ...
    await conn.close()
```

**CORRECT: Use connection pool**
```python
@app.get("/tracks")
async def get_tracks(conn = Depends(get_db_connection)):
    # conn from pool
    # ...
```

### 8.5 Not Handling PostGIS Extension Dependency

**CORRECT: Check PostGIS in startup**
```python
@app.on_event("startup")
async def check_postgis():
    async with db_pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT PostGIS_version()")
            version = await cur.fetchone()
            if not version:
                raise RuntimeError("PostGIS extension not installed")
            print(f"PostGIS version: {version[0]}")
```

---

## 9. Project Integration

### 9.1 How to Extend TrackRepository

**Adding a New Spatial Query**:

```python
# In src/db/database.py

class TrackRepository:
    # ... existing methods ...

    def get_points_with_anomalies(
        self,
        race_id: int,
        anomaly_type: str = "suspected_vehicle"
    ) -> List[Dict]:
        """
        Get track points with specific anomaly type.

        Args:
            race_id: Race ID
            anomaly_type: Anomaly type to filter (e.g., "suspected_vehicle")

        Returns:
            List of points with anomalies
        """
        sql = """
            SELECT
                tp.id,
                tp.track_id,
                t.pigeon_number,
                tp.timestamp,
                tp.latitude,
                tp.longitude,
                tp.altitude,
                tp.moving_speed,
                tp.wing_flaps_per_sec,
                tp.anomaly_flags
            FROM track_points tp
            JOIN tracks t ON t.id = tp.track_id
            WHERE t.race_id = %s
              AND tp.anomaly_flags ? %s
            ORDER BY tp.timestamp
        """
        return self.db.query(sql, (race_id, anomaly_type))
```

**Key Points**:
- Use `anomaly_flags ? 'key'` for JSONB key existence check
- Join with tracks table for race filtering
- Return dict results (compatible with existing pattern)

### 9.2 Adding New Auxiliary Fields

**Process**:

1. **Update database schema** (`sql/init.sql`):
```sql
ALTER TABLE track_points
ADD COLUMN new_field_name DOUBLE PRECISION;
```

2. **Update TrackRepository.get_track_points()** (`src/db/database.py`):
```python
def get_track_points(self, track_id: int) -> List[Dict]:
    sql = """
        SELECT
            ...,
            new_field_name,  -- Add here
            ...
        FROM track_points
        WHERE track_id = %s
        ORDER BY timestamp
    """
    return self.db.query(sql, (track_id,))
```

3. **Update batch_update_auxiliary_fields()** (`src/db/database.py`):
```python
values_list.append((
    point['id'],
    ...,
    point.get('new_field_name'),  -- Add here
    ...
))

sql = """
    UPDATE track_points AS tp
    SET
        ...,
        new_field_name = v.new_field_name::float,  -- Add here
        ...
    FROM (VALUES %s) AS v(
        point_id, ..., new_field_name, ...  -- Add here
    )
    WHERE tp.id = v.point_id::bigint
"""
```

4. **Update auxiliary calculator** (`src/core/auxiliary_calculator.py`):
```python
# Add calculation logic for new field
```

### 9.3 Migrating to Async (Future Improvement)

**Step 1: Install psycopg3**
```bash
pip install psycopg[pool]
```

**Step 2: Create async Database class**
```python
# src/db/async_database.py
from psycopg_pool import AsyncConnectionPool
from typing import List, Dict, Optional

class AsyncDatabase:
    def __init__(self, pool: AsyncConnectionPool):
        self.pool = pool

    async def query(self, sql: str, params: tuple = None) -> List[Dict]:
        """Query SQL (SELECT)"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, params)
                rows = await cur.fetchall()
                return [dict(row) for row in rows]

    async def execute(self, sql: str, params: tuple = None) -> None:
        """Execute SQL (INSERT, UPDATE, DELETE)"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, params)
                await conn.commit()
```

**Step 3: Convert TrackRepository methods to async**
```python
# src/db/repositories.py
class AsyncTrackRepository:
    def __init__(self, db: AsyncDatabase):
        self.db = db

    async def get_race_tracks(self, race_id: int) -> List[Dict]:
        sql = """..."""
        return await self.db.query(sql, (race_id,))
```

**Step 4: Update API endpoints**
```python
# src/api/main.py
@app.get("/api/races/{race_id}/tracks")
async def get_race_tracks(race_id: int):
    repo = AsyncTrackRepository(async_db)
    tracks = await repo.get_race_tracks(race_id)
    return tracks
```

---

## 10. Reference Links

### Official Documentation

- [PostGIS Official Docs - Performance Tips](https://postgis.net/docs/performance_tips.html)
- [PostGIS Spatial Indexing Workshop](http://postgis.net/workshops/postgis-intro/indexing.html)
- [PostGIS Function Reference](https://postgis.net/docs/reference.html)
- [PostgreSQL Documentation - GIST Indexes](https://www.postgresql.org/docs/current/gist.html)

### Connection Pooling

- [Psycopg3 Connection Pooling](https://www.psycopg.org/psycopg3/docs/advanced/pool.html)
- [Psycopg2 vs Psycopg3 Benchmark](https://www.tigerdata.com/blog/psycopg2-vs-psycopg3-performance-benchmark)
- [FastAPI Database Patterns](https://www.compilenrun.com/docs/framework/fastapi/fastapi-database/fastapi-database-patterns/)

### PostGIS Performance

- [PostGIS Geography vs Geometry](https://medium.com/coord/postgis-performance-showdown-geometry-vs-geography-ec99967da4f0)
- [Spatial Indexing Deep Dive](https://carto.com/blog/spatial-indexes-postgis/)
- [ST_DWithin Performance Tips](https://postgis.net/docs/ST_DWithin.html)

### Repository Pattern

- [Repository Pattern in Python](https://www.cosmicpython.com/book/chapter_02_repository.html)
- [SQLAlchemy Repository Pattern](https://ahmed-nafies.medium.com/repository-pattern-in-python-sqlalchemy-5e63d2e04beb)

### Transaction Management

- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Unit of Work Pattern](https://martinfowler.com/eaaCatalog/unitOfWork.html)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-10
**Maintainer**: Claude Code - Python FastAPI Guidelines Skill
