# FastAPI Routing and API Design

Comprehensive guide to FastAPI routing patterns, dependency injection, API versioning, middleware configuration, and path operation features. This reference provides production-ready patterns with real examples from the track filtering system.

## Table of Contents

1. [Overview](#1-overview)
2. [Current Project Architecture](#2-current-project-architecture)
3. [Router Organization Patterns](#3-router-organization-patterns)
4. [Dependency Injection](#4-dependency-injection)
5. [API Versioning Strategies](#5-api-versioning-strategies)
6. [Middleware Configuration](#6-middleware-configuration)
7. [Path Operation Features](#7-path-operation-features)
8. [Project Extension Guide](#8-project-extension-guide)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Reference Links](#10-reference-links)

---

## 1. Overview

FastAPI routing is the foundation of API design, controlling how HTTP requests map to Python functions. This guide covers:

- **Router organization**: How to structure routes as your API grows
- **Dependency injection**: Managing shared resources (database, auth, config)
- **API versioning**: Strategies for backward compatibility
- **Middleware**: Cross-cutting concerns (CORS, logging, auth)
- **Path operations**: Advanced features (tags, response models, OpenAPI)

**Key Principles:**

1. **Modularity**: Split routes by domain (races, tracks, filters)
2. **Reusability**: Use dependency injection for shared logic
3. **Maintainability**: Clear structure for team collaboration
4. **Documentation**: Auto-generated OpenAPI docs

---

## 2. Current Project Architecture

### 2.1 Project Structure

The track filtering system currently uses a **single-file API** structure:

```
track_filter/
├── src/
│   ├── api/
│   │   └── main.py              # All endpoints in one file (273 lines)
│   ├── core/
│   │   ├── filter_engine.py
│   │   ├── expression_evaluator.py
│   │   └── auxiliary_calculator.py
│   └── db/
│       └── database.py          # Database + TrackRepository
├── frontend/
│   └── index.html               # Single-page Vue.js app
└── tests/
    └── integration/
```

### 2.2 Current API Endpoints

**Analyzed from `src/api/main.py`:**

```python
# Root
GET  /                           # API info

# Health
GET  /health                     # Database connectivity check

# Races
GET  /api/races                  # List all races
GET  /api/races/{id}/auxiliary-status
POST /api/races/{id}/calculate-auxiliary
GET  /api/races/{id}/tracks      # Get tracks with points

# Tracks
GET  /api/tracks/{id}/detail     # Track details with optional points

# Filters
POST /api/filter/validate-expression
POST /api/filter/execute
GET  /api/filter/templates
POST /api/filter/templates
GET  /api/filter/results/{id}
```

### 2.3 Current Dependency Pattern

**Database Initialization (App-Level):**

```python
# src/api/main.py (line 33)
db = Database()  # Global singleton

# Used directly in endpoints
@app.get("/api/races")
def get_races():
    sql = "SELECT * FROM races ORDER BY race_date DESC"
    races = db.query(sql)  # Direct database access
    return races
```

**Why this works for MVP:**
- Simple and direct
- No overhead for small team
- Fast prototyping

**When to refactor:**
- Team grows beyond 2-3 developers
- Adding authentication/authorization
- Need for testing with mocked dependencies
- Multiple database connections (read/write split)

### 2.4 Current Middleware Setup

```python
# src/api/main.py (lines 24-30)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # Development mode
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Status:** Development-only configuration (allows all origins)

---

## 3. Router Organization Patterns

### 3.1 When to Refactor from Single File

**Keep single file if:**
- < 15 endpoints
- < 500 lines in main.py
- Single developer
- MVP/prototype stage

**Split into routers when:**
- 15+ endpoints
- Multiple developers
- Need domain separation (races, tracks, filters)
- Adding API versioning

### 3.2 Module-Functionality Structure (Recommended)

**Best for domain-driven design:**

```python
# Step 1: Create router modules
# src/api/v1/races.py
from fastapi import APIRouter, Depends
from src.db.database import Database, TrackRepository

router = APIRouter(prefix="/races", tags=["races"])

@router.get("")
async def get_races(db: Database = Depends(get_db)):
    sql = "SELECT * FROM races ORDER BY race_date DESC"
    return db.query(sql)

@router.get("/{race_id}/tracks")
async def get_race_tracks(race_id: int, db: Database = Depends(get_db)):
    repo = TrackRepository(db)
    return repo.get_race_tracks_with_points(race_id)

# src/api/v1/filters.py
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/filter", tags=["filters"])

@router.post("/validate-expression")
async def validate_expression(request: ExpressionValidationRequest):
    validator = ExpressionValidator()
    try:
        result = validator.validate(request.expression)
        return {"valid": True, "error": None, **result}
    except ValueError as e:
        return {"valid": False, "error": str(e)}

# Step 2: Combine routers
# src/api/v1/__init__.py
from fastapi import APIRouter
from src.api.v1 import races, tracks, filters

api_router = APIRouter()
api_router.include_router(races.router)
api_router.include_router(tracks.router)
api_router.include_router(filters.router)

# Step 3: Mount in main app
# src/api/main.py
from src.api.v1 import api_router

app = FastAPI(
    title="Track Filter System API",
    description="Pigeon racing trajectory filtering and anomaly detection",
    version="1.0.0"
)

app.include_router(api_router, prefix="/api/v1")
```

**Resulting structure:**

```
src/api/
├── main.py                 # FastAPI app + middleware
├── deps.py                 # Shared dependencies
└── v1/
    ├── __init__.py         # Combined router
    ├── races.py            # Race endpoints
    ├── tracks.py           # Track endpoints
    └── filters.py          # Filter endpoints
```

### 3.3 File-Type Structure (Alternative)

**Best for microservices or team conventions:**

```python
src/
├── api/                    # All route definitions
│   ├── races.py
│   ├── tracks.py
│   └── filters.py
├── crud/                   # All database operations
│   ├── races.py
│   ├── tracks.py
│   └── filters.py
├── schemas/                # All Pydantic models
│   ├── race.py
│   ├── track.py
│   └── filter.py
└── core/                   # Business logic
    ├── filter_engine.py
    └── auxiliary_calculator.py
```

**Trade-offs:**

| Aspect | Module-Functionality | File-Type |
|--------|---------------------|-----------|
| Domain cohesion | High (all race code together) | Low (split across folders) |
| Team collaboration | Easy (clear ownership) | Medium (need coordination) |
| Microservice migration | Easy (copy module) | Hard (reassemble from multiple folders) |
| File navigation | Medium (deeper nesting) | Easy (flat structure) |

**Recommendation for this project:** Module-Functionality (aligns with domain: races, tracks, filters)

### 3.4 Router Tags and Metadata

**Organize OpenAPI documentation:**

```python
# src/api/v1/races.py
router = APIRouter(
    prefix="/races",
    tags=["races"],
    responses={404: {"description": "Race not found"}},
)

@router.get("/{race_id}", summary="Get race by ID")
async def get_race(race_id: int):
    """
    Retrieve a race by ID with start/end point coordinates.

    - **race_id**: The unique race identifier
    - Returns race details with PostGIS geometry converted to lat/lng
    """
    pass

# src/api/v1/filters.py
router = APIRouter(
    prefix="/filter",
    tags=["filters"],
    responses={
        400: {"description": "Invalid filter rule"},
        500: {"description": "Filter execution failed"}
    },
)
```

**Result:** Clean API documentation grouped by domain in `/docs`

---

## 4. Dependency Injection

### 4.1 Three Levels of Dependencies

**Level 1: App-Level (Database Connection)**

Current pattern (global singleton):

```python
# src/api/main.py (line 33)
db = Database()  # Created once at startup

@app.get("/api/races")
def get_races():
    races = db.query(sql)  # Direct access
    return races
```

**Refactored pattern (dependency injection):**

```python
# src/api/deps.py
from typing import Generator
from src.db.database import Database

def get_db() -> Generator[Database, None, None]:
    """
    Database dependency for request lifecycle.
    - Creates connection per request
    - Auto-closes after response
    - Enables testing with mock database
    """
    db = Database()
    try:
        yield db
    finally:
        db.close()  # Ensure cleanup

# src/api/v1/races.py
from fastapi import Depends
from src.api.deps import get_db

@router.get("")
async def get_races(db: Database = Depends(get_db)):
    sql = "SELECT * FROM races ORDER BY race_date DESC"
    return db.query(sql)
```

**Benefits:**
- Testable (override with mock database)
- Resource cleanup guaranteed
- Per-request isolation

**When to use:**
- Adding authentication
- Need for testing
- Multiple database connections (read/write split)

**Level 2: Router-Level (Shared Authentication)**

```python
# src/api/deps.py
from fastapi import Header, HTTPException

async def verify_api_key(
    x_api_key: str = Header(None, description="API Key")
):
    """Verify API key for authenticated endpoints"""
    if x_api_key != "secret-key-from-env":
        raise HTTPException(403, "Invalid API key")
    return x_api_key

# src/api/v1/filters.py
router = APIRouter(
    prefix="/filter",
    tags=["filters"],
    dependencies=[Depends(verify_api_key)]  # Applied to all routes
)

@router.post("/execute")
async def execute_filter(request: FilterExecuteRequest):
    # Already authenticated by router dependency
    pass
```

**Level 3: Route-Level (Business Logic)**

```python
# src/api/deps.py
from src.core.filter_engine import FilterEngine

def get_filter_engine(db: Database = Depends(get_db)) -> FilterEngine:
    """Create filter engine with database dependency"""
    return FilterEngine(db)

# src/api/v1/filters.py
@router.post("/execute")
async def execute_filter(
    request: FilterExecuteRequest,
    engine: FilterEngine = Depends(get_filter_engine)
):
    result = engine.execute_filter(request.race_id, request.rule)
    return result
```

### 4.2 Current Project's get_db() Pattern

**Implementing for this project:**

```python
# src/api/deps.py (new file)
from typing import Generator
from src.db.database import Database

def get_db() -> Generator[Database, None, None]:
    """
    Database dependency for track filtering system.

    Lifecycle:
    1. Create connection when request starts
    2. Yield to route handler
    3. Close connection after response

    Usage:
        @router.get("/races")
        def get_races(db: Database = Depends(get_db)):
            return db.query("SELECT * FROM races")
    """
    db = Database()
    try:
        yield db
    finally:
        # Database.close() not implemented yet
        # Add when refactoring Database class
        pass

# Migration: Replace global db with dependency
# Before (src/api/main.py line 33):
db = Database()  # Remove this

# After (all endpoints):
@app.get("/api/races")
def get_races(db: Database = Depends(get_db)):
    sql = "SELECT * FROM races"
    return db.query(sql)
```

### 4.3 Dependency Overriding for Tests

**Enable testing with mock database:**

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.api.deps import get_db

class MockDatabase:
    """Mock database for testing"""
    def query(self, sql, params=None):
        if "races" in sql:
            return [{"id": 1, "name": "Test Race"}]
        return []

@pytest.fixture
def client():
    """Test client with mocked database"""
    def override_get_db():
        yield MockDatabase()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

# tests/test_races.py
def test_get_races(client):
    response = client.get("/api/races")
    assert response.status_code == 200
    assert response.json()[0]["name"] == "Test Race"
```

### 4.4 Dependency Caching

**FastAPI automatically caches dependencies per request:**

```python
# src/api/deps.py
def get_db():
    print("Creating database connection")  # Called once per request
    db = Database()
    yield db

@router.get("/complex-operation")
async def complex_op(
    db1: Database = Depends(get_db),  # Same instance
    db2: Database = Depends(get_db),  # Same instance (cached)
):
    # Both db1 and db2 point to the same Database object
    # "Creating database connection" printed only once
    pass
```

**Disable caching if needed:**

```python
from fastapi import Depends

@router.get("/data")
async def get_data(
    db: Database = Depends(get_db, use_cache=False)  # New instance every time
):
    pass
```

---

## 5. API Versioning Strategies

### 5.1 When to Version Your API

**Add versioning when:**
- Breaking changes needed (field removal, type change)
- Multiple client apps depend on API
- Long-term stability required
- Mobile apps (can't force updates)

**Current project status:** Single version, no versioning needed yet

### 5.2 Approach 1: Sub-Applications (Recommended)

**Best for independent documentation per version:**

```python
# src/api/main.py
from fastapi import FastAPI

# Main application
app = FastAPI(
    title="Track Filter System",
    description="Multi-version API for pigeon racing trajectory analysis"
)

# Version-specific apps
app_v1 = FastAPI(
    title="Track Filter API v1",
    version="1.0.0",
    description="Legacy API with basic filtering"
)

app_v2 = FastAPI(
    title="Track Filter API v2",
    version="2.0.0",
    description="Enhanced API with computed fields and confidence scoring"
)

# Import version-specific routers
from src.api.v1 import api_router as v1_router
from src.api.v2 import api_router as v2_router

# Register routes for each version
app_v1.include_router(v1_router)
app_v2.include_router(v2_router)

# Mount as sub-applications
app.mount("/v1", app_v1)
app.mount("/v2", app_v2)

# Independent documentation URLs:
# - /v1/docs (OpenAPI for v1)
# - /v2/docs (OpenAPI for v2)
# - /docs (main app, can redirect to latest)
```

**Benefits:**
- Isolated OpenAPI documentation
- Different middleware per version
- Clear separation of concerns
- Easy deprecation (remove mount)

**Structure:**

```
src/api/
├── main.py                 # Mount points
├── deps.py                 # Shared dependencies
├── v1/
│   ├── __init__.py         # v1 router
│   ├── races.py
│   └── filters.py          # Basic filter rules
└── v2/
    ├── __init__.py         # v2 router
    ├── races.py
    └── filters.py          # Enhanced with computed fields
```

### 5.3 Approach 2: Router Prefixes (Simpler)

**Best for shared infrastructure:**

```python
# src/api/main.py
app = FastAPI(title="Track Filter System")

from src.api.v1 import api_router as v1_router
from src.api.v2 import api_router as v2_router

app.include_router(v1_router, prefix="/api/v1", tags=["v1"])
app.include_router(v2_router, prefix="/api/v2", tags=["v2"])

# Single documentation at /docs with all versions
```

**Benefits:**
- Simpler setup
- Single OpenAPI doc
- Shared middleware

**Drawbacks:**
- No version-specific docs
- Harder to deprecate old versions

### 5.4 Approach 3: Header-Based Versioning

**Best for REST purists:**

```python
# src/api/deps.py
from fastapi import Header, HTTPException

async def get_api_version(
    accept_version: str = Header("1.0", alias="Accept-Version")
) -> str:
    """Extract and validate API version from header"""
    if accept_version not in ["1.0", "2.0"]:
        raise HTTPException(400, f"Unsupported API version: {accept_version}")
    return accept_version

# src/api/v1/filters.py
@router.post("/filter/execute")
async def execute_filter(
    request: FilterExecuteRequest,
    version: str = Depends(get_api_version)
):
    if version == "1.0":
        # Legacy logic: Simple threshold filtering
        return legacy_filter(request)
    else:
        # v2.0 logic: Confidence scoring + computed fields
        return enhanced_filter(request)
```

**Benefits:**
- Clean URLs (no /v1/ prefix)
- RESTful approach
- Flexible version negotiation

**Drawbacks:**
- Harder for clients (header not visible in browser)
- More complex routing logic
- Single codebase for all versions

### 5.5 Version Migration Example for This Project

**Scenario:** Adding computed fields in v2 (breaking change for frontend)

```python
# src/api/v1/filters.py (legacy)
class FilterRuleV1(BaseModel):
    conditions: List[Dict[str, Any]]  # Simple conditions only

@router.post("/filter/execute")
async def execute_filter_v1(rule: FilterRuleV1):
    # No computed fields support
    engine = FilterEngine(db)
    return engine.execute_simple_filter(rule)

# src/api/v2/filters.py (enhanced)
class FilterRuleV2(BaseModel):
    conditions: List[Dict[str, Any]]
    computed_fields: Optional[List[ComputedField]] = []  # New feature

@router.post("/filter/execute")
async def execute_filter_v2(rule: FilterRuleV2):
    # Support computed fields
    engine = FilterEngine(db)
    return engine.execute_filter(rule)  # Enhanced method
```

**Deprecation strategy:**

```python
# src/api/v1/filters.py
from fastapi import status

@router.post(
    "/filter/execute",
    deprecated=True,  # Shows as deprecated in OpenAPI docs
    responses={
        status.HTTP_200_OK: {
            "description": "Deprecated. Use /v2/filter/execute for computed fields support."
        }
    }
)
async def execute_filter_v1(rule: FilterRuleV1):
    pass
```

---

## 6. Middleware Configuration

### 6.1 Current CORS Setup (Development Only)

```python
# src/api/main.py (lines 24-30)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # DANGEROUS in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.2 Production CORS Configuration

**Environment-based CORS:**

```python
# src/core/config.py (new file)
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    FRONTEND_URLS: list[str] = ["http://localhost:8080"]

    class Config:
        env_file = ".env"

settings = Settings()

# src/api/main.py
from src.core.config import settings

if settings.ENVIRONMENT == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Production: Explicit origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.FRONTEND_URLS,  # e.g., ["https://app.example.com"]
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-Total-Count", "X-Request-ID"],
    )
```

### 6.3 Request Logging Middleware

**Add request/response logging:**

```python
# src/api/middleware.py (new file)
import time
import uuid
import logging
from fastapi import Request

logger = logging.getLogger(__name__)

async def log_requests(request: Request, call_next):
    """
    Log all requests with timing and correlation ID.

    IMPORTANT: Add AFTER CORSMiddleware to avoid preflight issues
    """
    # Generate unique ID for request correlation
    request_id = str(uuid.uuid4())

    # Log request details
    logger.info(
        "Request started",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host,
            "user_agent": request.headers.get("user-agent")
        }
    )

    # Process request and measure time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    # Add headers for debugging
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.3f}"

    # Log response
    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "process_time": process_time
        }
    )

    return response

# src/api/main.py
from src.api.middleware import log_requests

app.middleware("http")(log_requests)
```

### 6.4 Critical: Middleware Ordering

**Middleware executes in REVERSE order:**

```python
# src/api/main.py

# Step 1: Add CORS middleware FIRST
app.add_middleware(CORSMiddleware, ...)

# Step 2: Add logging middleware
app.middleware("http")(log_requests)

# Step 3: Add authentication middleware (if needed)
app.middleware("http")(authenticate_request)

# Execution flow:
# Request → Authenticate → Log → CORS → Route Handler
# Response → CORS → Log → Authenticate → Client
```

**Why order matters:**

1. **CORS before logging**: Preflight OPTIONS requests need CORS headers immediately
2. **Logging before auth**: Log all attempts (including failed auth)
3. **Auth after logging**: Ensure request_id generated before auth check

### 6.5 Error Handling Middleware

**Catch and log all exceptions:**

```python
# src/api/middleware.py
from fastapi import Request, status
from fastapi.responses import JSONResponse

async def catch_exceptions(request: Request, call_next):
    """
    Catch unhandled exceptions and return structured errors.
    """
    try:
        return await call_next(request)
    except ValueError as e:
        # Business logic errors (e.g., invalid expression)
        logger.warning(f"Validation error: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )
    except Exception as e:
        # Unexpected errors
        logger.exception(f"Unhandled exception: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"}
        )

# src/api/main.py
app.middleware("http")(catch_exceptions)
```

---

## 7. Path Operation Features

### 7.1 Tags for Documentation Grouping

**Current project tags:**

```python
# src/api/v1/races.py
router = APIRouter(prefix="/races", tags=["races"])

# src/api/v1/filters.py
router = APIRouter(prefix="/filter", tags=["filters"])

# Result in /docs: Endpoints grouped by tag
```

### 7.2 Summaries and Descriptions

**Enhance OpenAPI documentation:**

```python
@router.post(
    "/filter/execute",
    summary="Execute filter rule on race tracks",
    description="""
    Execute a filtering rule to identify suspicious track segments.

    The rule supports:
    - Conditional logic (AND/OR operators)
    - Computed fields (custom expressions)
    - Confidence scoring

    Returns list of tracks with suspicious segments.
    """,
    response_description="Filter execution result with confidence scores",
)
async def execute_filter(request: FilterExecuteRequest):
    pass
```

### 7.3 Response Models and Status Codes

**Type-safe responses:**

```python
# src/schemas/filter.py (new file)
from pydantic import BaseModel, Field

class FilterResult(BaseModel):
    """Filter execution result"""
    filter_result_id: int
    total_tracks_analyzed: int
    suspicious_tracks_count: int
    average_confidence: float = Field(ge=0.0, le=1.0)
    results: List[TrackResult]

# src/api/v1/filters.py
from src.schemas.filter import FilterResult

@router.post(
    "/filter/execute",
    response_model=FilterResult,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"description": "Invalid filter rule"},
        404: {"description": "Race not found"},
        500: {"description": "Filter execution failed"}
    }
)
async def execute_filter(request: FilterExecuteRequest) -> FilterResult:
    result = engine.execute_filter(request.race_id, request.rule)
    return FilterResult(**result)  # Automatic validation
```

**Benefits:**
- Type checking in IDE
- Automatic OpenAPI schema generation
- Response validation
- Clear error codes in documentation

### 7.4 Background Tasks

**Long-running operations:**

```python
from fastapi import BackgroundTasks

def calculate_auxiliary_fields_background(race_id: int):
    """Background task for auxiliary field calculation"""
    calculator = AuxiliaryFieldCalculator(Database())
    calculator.calculate_batch(race_id)

@router.post("/{race_id}/calculate-auxiliary")
async def calculate_auxiliary(
    race_id: int,
    background_tasks: BackgroundTasks
):
    """Trigger auxiliary field calculation in background"""
    background_tasks.add_task(calculate_auxiliary_fields_background, race_id)
    return {"status": "processing", "race_id": race_id}

# Client receives immediate response
# Calculation happens asynchronously
```

**Use cases:**
- Auxiliary field calculation (currently blocks for 2 minutes)
- Email sending
- Cache warming
- Report generation

---

## 8. Project Extension Guide

### 8.1 Adding a New Endpoint (Current Structure)

**Scenario:** Add endpoint to get track statistics

```python
# src/api/main.py

class TrackStatsResponse(BaseModel):
    """Track statistics response model"""
    track_id: int
    total_points: int
    avg_speed: float
    avg_altitude: float
    suspected_cheating_segments: int

@app.get(
    "/api/tracks/{track_id}/stats",
    response_model=TrackStatsResponse,
    tags=["tracks"],
    summary="Get track statistics"
)
def get_track_stats(track_id: int, db: Database = Depends(get_db)):
    """
    Calculate statistics for a track.

    - Total GPS points
    - Average speed and altitude
    - Number of suspected cheating segments
    """
    repo = TrackRepository(db)

    # Get track points
    points = repo.get_track_points(track_id)

    if not points:
        raise HTTPException(404, "Track not found")

    # Calculate statistics
    speeds = [p['moving_speed'] for p in points if p['moving_speed']]
    altitudes = [p['altitude'] for p in points if p['altitude']]
    suspected = sum(1 for p in points if p['anomaly_flags'] and 'suspected_vehicle' in p['anomaly_flags'])

    return TrackStatsResponse(
        track_id=track_id,
        total_points=len(points),
        avg_speed=sum(speeds) / len(speeds) if speeds else 0,
        avg_altitude=sum(altitudes) / len(altitudes) if altitudes else 0,
        suspected_cheating_segments=suspected
    )
```

### 8.2 Adding a New Endpoint (Modular Structure)

**If you've refactored to routers:**

```python
# Step 1: Create Pydantic models
# src/schemas/track.py
from pydantic import BaseModel

class TrackStatsResponse(BaseModel):
    track_id: int
    total_points: int
    avg_speed: float
    avg_altitude: float
    suspected_cheating_segments: int

# Step 2: Add business logic
# src/services/track_service.py
class TrackService:
    def __init__(self, db: Database):
        self.repo = TrackRepository(db)

    def get_statistics(self, track_id: int) -> TrackStatsResponse:
        points = self.repo.get_track_points(track_id)
        # ... calculation logic ...
        return TrackStatsResponse(...)

# Step 3: Create dependency
# src/api/deps.py
def get_track_service(db: Database = Depends(get_db)) -> TrackService:
    return TrackService(db)

# Step 4: Add route
# src/api/v1/tracks.py
@router.get("/{track_id}/stats", response_model=TrackStatsResponse)
async def get_track_stats(
    track_id: int,
    service: TrackService = Depends(get_track_service)
):
    return service.get_statistics(track_id)
```

### 8.3 Adding a New Auxiliary Field

**Scenario:** Add "vibration_amplitude" field

```python
# Step 1: Update database schema
# sql/migrations/001_add_vibration_amplitude.sql
ALTER TABLE track_points
ADD COLUMN vibration_amplitude DOUBLE PRECISION;

# Step 2: Update calculator
# src/core/auxiliary_calculator.py
class AuxiliaryFieldCalculator:
    def calculate_vibration(self, points: List[Dict]) -> None:
        """Calculate vibration amplitude from accelerometer data"""
        for i, point in enumerate(points):
            if 'accelerometer_z' in point:
                # Calculate vibration during wing beat
                amplitude = self._calculate_amplitude(point)

                # Update database
                sql = """
                    UPDATE track_points
                    SET vibration_amplitude = %s
                    WHERE id = %s
                """
                self.db.execute(sql, (amplitude, point['id']))

# Step 3: Update expression validator
# src/core/expression_evaluator.py
class ExpressionValidator:
    ALLOWED_FIELDS = [
        # ... existing fields ...
        'vibration_amplitude',  # Add new field
    ]

# Step 4: Update API response
# src/api/v1/tracks.py
@router.get("/{track_id}/detail")
async def get_track_detail(track_id: int):
    points = repo.get_track_points(track_id)
    # vibration_amplitude automatically included
    return {"track_id": track_id, "points": points}
```

### 8.4 Adding Authentication

**JWT-based authentication:**

```python
# Step 1: Install dependencies
# pip install python-jose[cryptography] passlib[bcrypt]

# Step 2: Create auth dependency
# src/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Verify JWT token and extract user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = payload.get("sub")
        if not username:
            raise HTTPException(401, "Invalid token")
        return username
    except JWTError:
        raise HTTPException(401, "Invalid token")

# Step 3: Protect endpoints
# src/api/v1/filters.py
@router.post("/execute")
async def execute_filter(
    request: FilterExecuteRequest,
    current_user: str = Depends(get_current_user)  # Requires auth
):
    logger.info(f"User {current_user} executing filter")
    # ... execute filter ...
```

---

## 9. Common Pitfalls

### 9.1 Using Blocking Code in Async Routes

**Problem:**

```python
# WRONG: Blocks event loop
import requests

@app.get("/external-data")
async def get_external_data():
    # requests.get is synchronous - blocks all other requests!
    response = requests.get("https://api.example.com/data")
    return response.json()
```

**Solution:**

```python
# CORRECT: Use async HTTP client
import httpx

@app.get("/external-data")
async def get_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        return response.json()
```

**For this project:**

```python
# Current Database.query() is synchronous - acceptable because:
# 1. PostgreSQL driver (psycopg2) doesn't support async yet
# 2. Single-threaded uvicorn handles it fine
# 3. For async, use psycopg3 (asyncpg) later

# Future: Async database
from psycopg import AsyncConnection

async def get_async_db():
    async with await AsyncConnection.connect(...) as conn:
        yield conn

@router.get("/races")
async def get_races(db: AsyncConnection = Depends(get_async_db)):
    result = await db.execute("SELECT * FROM races")
    return await result.fetchall()
```

### 9.2 Global State with Multiple Workers

**Problem:**

```python
# WRONG: Shared state across workers (unpredictable)
filter_cache = {}  # Global dictionary

@app.post("/filter/execute")
async def execute_filter(request: FilterExecuteRequest):
    # Each worker has its own global state - not synchronized!
    filter_cache[request.race_id] = result
    return result

# Running with: uvicorn main:app --workers 4
# Worker 1 caches result, Worker 2 can't see it!
```

**Solution:**

```python
# CORRECT: Use database or Redis for shared state
from redis.asyncio import Redis

async def get_redis():
    redis = Redis(host="localhost", port=6379)
    yield redis
    await redis.close()

@app.post("/filter/execute")
async def execute_filter(
    request: FilterExecuteRequest,
    redis: Redis = Depends(get_redis)
):
    # All workers share Redis
    await redis.set(f"filter:{request.race_id}", json.dumps(result))
    return result
```

### 9.3 Using --reload in Production

**Problem:**

```bash
# WRONG: Development mode in production
uvicorn main:app --reload --workers 4

# --reload watches for file changes (overhead)
# --reload + --workers conflict (reload doesn't work)
```

**Solution:**

```bash
# CORRECT: Production mode
uvicorn main:app \
  --workers 4 \
  --host 0.0.0.0 \
  --port 8000 \
  --log-level info \
  --no-access-log  # Use middleware for logging instead
```

### 9.4 Endpoint Calling Endpoint (Anti-Pattern)

**Problem:**

```python
# WRONG: HTTP call to own endpoint
@app.get("/user/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "name": "John"}

@app.get("/user/{user_id}/posts")
async def get_user_posts(user_id: int):
    # Anti-pattern: Adds HTTP overhead and complexity
    user = requests.get(f"http://localhost:8000/user/{user_id}").json()
    posts = get_posts_from_db(user_id)
    return {"user": user, "posts": posts}
```

**Solution:**

```python
# CORRECT: Share business logic via services
class UserService:
    def get_user(self, user_id: int):
        return {"id": user_id, "name": "John"}

@app.get("/user/{user_id}")
async def get_user(user_id: int, service: UserService = Depends()):
    return service.get_user(user_id)

@app.get("/user/{user_id}/posts")
async def get_user_posts(user_id: int, service: UserService = Depends()):
    # Direct method call - no HTTP overhead
    user = service.get_user(user_id)
    posts = get_posts_from_db(user_id)
    return {"user": user, "posts": posts}
```

### 9.5 Forgetting to Validate Response Models

**Problem:**

```python
# WRONG: No validation, client gets unexpected data
@app.get("/track/{track_id}")
async def get_track(track_id: int):
    # Returns raw database dict - might have extra/missing fields
    return db.query_one("SELECT * FROM tracks WHERE id = %s", (track_id,))
```

**Solution:**

```python
# CORRECT: Response model ensures consistent schema
class TrackResponse(BaseModel):
    id: int
    pigeon_number: str
    total_points: int
    avg_speed: Optional[float] = None

@app.get("/track/{track_id}", response_model=TrackResponse)
async def get_track(track_id: int):
    track = db.query_one("SELECT * FROM tracks WHERE id = %s", (track_id,))
    # Pydantic validates and filters to only defined fields
    return TrackResponse(**track)
```

---

## 10. Reference Links

### Official Documentation

- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [FastAPI - Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/)
- [FastAPI - Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [FastAPI - Middleware](https://fastapi.tiangolo.com/advanced/middleware/)
- [FastAPI - API Versioning](https://fastapi.tiangolo.com/advanced/sub-applications/)

### Production Examples

- [fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) - Comprehensive patterns
- [Netflix Dispatch](https://github.com/Netflix/dispatch) - Real-world FastAPI architecture
- [FastAPI Production Boilerplate](https://github.com/iam-abbas/FastAPI-Production-Boilerplate) - Layered architecture
- [fastapi-clean-architecture](https://github.com/jujumilk3/fastapi-clean-architecture) - DDD patterns

### Articles and Guides

- [Organizing Large FastAPI Projects](https://www.codingeasypeasy.com/blog/organizing-large-fastapi-projects-modular-routers-for-scalable-apis)
- [Advanced FastAPI Patterns 2024](https://dev.to/aaravjoshi/advanced-fastapi-patterns-building-production-ready-apis-with-python-2024-guide-2mf9)
- [FastAPI Dependency Injection Deep Dive](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-in-path-operation-decorators/)

### Related Skills

- [pydantic-models.md](pydantic-models.md) - Request/response validation
- [postgresql-postgis.md](postgresql-postgis.md) - Database patterns
- [error-handling.md](error-handling.md) - Exception handling and logging
- [testing-pytest.md](testing-pytest.md) - Testing FastAPI applications

---

**Last Updated:** 2025-11-10
**Project Version:** 1.0.0
**FastAPI Version:** 0.121.0
