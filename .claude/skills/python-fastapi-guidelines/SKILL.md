---
description: FastAPI + Python best practices for building production-ready APIs with PostgreSQL/PostGIS, Pydantic v2, and pytest. Covers routing patterns, dependency injection, spatial queries, type safety, error handling, and testing strategies.
triggers:
  - path: "src/api/**/*.py"
  - path: "src/core/**/*.py"
  - path: "src/db/**/*.py"
  - path: "tests/**/*.py"
  - keyword: "fastapi"
  - keyword: "pydantic"
  - keyword: "postgresql"
  - keyword: "postgis"
  - content: "from fastapi import"
  - content: "class.*BaseModel"
  - content: "@app.get"
  - content: "@app.post"
  - content: "ST_DWithin"
  - content: "ST_Distance"
---

# Python FastAPI Guidelines

Production-ready patterns for FastAPI applications with PostgreSQL/PostGIS. This skill provides quick reference for common tasks and links to comprehensive guides for complex scenarios.

## Quick Decision Tree

**Need help with:**
- Creating endpoints or organizing routes? → See [FastAPI Routing](#fastapi-routing-patterns) or [fastapi-routing.md](references/fastapi-routing.md)
- Request/response validation? → See [Pydantic Models](#pydantic-models-v2) or [pydantic-models.md](references/pydantic-models.md)
- Database queries or spatial operations? → See [PostgreSQL + PostGIS](#postgresql-postgis-patterns) or [postgresql-postgis.md](references/postgresql-postgis.md)
- Error handling or logging? → See [Error Handling](#error-handling) or [error-handling.md](references/error-handling.md)
- Writing tests? → See [Testing](#testing-with-pytest) or [testing-pytest.md](references/testing-pytest.md)
- Type errors? → See [Type Safety](#type-safety) or [type-safety.md](references/type-safety.md)

---

## FastAPI Routing Patterns

### Basic Route with Dependency Injection

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from src.db.database import Database

router = APIRouter(prefix="/tracks", tags=["tracks"])

def get_db() -> Database:
    db = Database()
    try:
        yield db
    finally:
        pass  # cleanup

@router.get("/{track_id}", response_model=TrackResponse)
async def get_track(
    track_id: int,
    db: Database = Depends(get_db)
) -> TrackResponse:
    track = db.query_one("SELECT * FROM tracks WHERE id = %s", (track_id,))
    if not track:
        raise HTTPException(404, "Track not found")
    return TrackResponse(**track)
```

### API Versioning with Sub-Applications

```python
from fastapi import FastAPI

app = FastAPI()
app_v1 = FastAPI(title="API v1")
app_v2 = FastAPI(title="API v2")

app.mount("/v1", app_v1)
app.mount("/v2", app_v2)
```

**For details:** [fastapi-routing.md](references/fastapi-routing.md)

---

## Pydantic Models (v2)

### Request/Response Models

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class TrackCreate(BaseModel):
    pigeon_number: str = Field(min_length=1, max_length=50)
    race_id: int = Field(gt=0)
    total_points: int = Field(gt=0)

    @field_validator('pigeon_number')
    @classmethod
    def validate_format(cls, v: str) -> str:
        if not v.match(r'^[A-Z]{2}-\d{4}-\d{3}$'):
            raise ValueError('Invalid format: XX-YYYY-NNN')
        return v

class TrackResponse(TrackCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)  # ORM mode
```

### Pydantic v1 → v2 Migration

```python
# v1 (Deprecated)
class Config:
    orm_mode = True

@validator('field')
def check_field(cls, v):
    return v

# v2 (Current)
model_config = ConfigDict(from_attributes=True)

@field_validator('field')
@classmethod
def check_field(cls, v: str) -> str:
    return v
```

**For details:** [pydantic-models.md](references/pydantic-models.md)

---

## PostgreSQL + PostGIS Patterns

### Connection Pool Setup (Recommended)

```python
from psycopg_pool import AsyncConnectionPool
from contextlib import asynccontextmanager
from fastapi import FastAPI

db_pool: AsyncConnectionPool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = AsyncConnectionPool(
        conninfo="postgresql://user:pass@localhost/dbname",
        min_size=5,
        max_size=20
    )
    await db_pool.wait()
    yield
    await db_pool.close()

app = FastAPI(lifespan=lifespan)
```

### Geography vs Geometry Decision

| Use Case | Type | Why |
|----------|------|-----|
| Cross-country distances | Geography | Accurate meters |
| City-level data | Geometry | 2x faster |
| Distance in meters | Geography | Built-in metric |
| Complex spatial ops | Geometry | More functions |

### Spatial Queries

```python
# Distance check (uses index)
await cur.execute("""
    SELECT * FROM track_points
    WHERE ST_DWithin(geom::geography, ST_Point(%s, %s)::geography, 1000)
""", (lon, lat))

# Nearest neighbor with LATERAL join
await cur.execute("""
    SELECT h.name, ST_Distance(tp.geom::geography, h.geom::geography) as dist
    FROM track_points tp
    CROSS JOIN LATERAL (
        SELECT * FROM highways
        ORDER BY tp.geom::geography <-> highways.geom::geography LIMIT 1
    ) h WHERE tp.track_id = %s
""", (track_id,))
```

### Batch Updates (10-50x faster)

```python
from psycopg2.extras import execute_values

values = [(p['id'], p['speed'], p['altitude']) for p in points]
sql = "UPDATE track_points tp SET moving_speed = v.speed::float FROM (VALUES %s) AS v(id, speed) WHERE tp.id = v.id::bigint"
execute_values(cursor, sql, values, page_size=500)
```

**For details:** [postgresql-postgis.md](references/postgresql-postgis.md)

---

## Error Handling

### Custom Exception Hierarchy

```python
from fastapi import HTTPException, status

class TrackFilterException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str):
        super().__init__(status_code=status_code, detail=detail, headers={"X-Error-Code": error_code})

class TrackNotFoundException(TrackFilterException):
    def __init__(self, track_id: int):
        super().__init__(status.HTTP_404_NOT_FOUND, f"Track {track_id} not found", "TRACK_NOT_FOUND")

@app.exception_handler(TrackFilterException)
async def handle_domain_exception(request: Request, exc: TrackFilterException):
    return JSONResponse(status_code=exc.status_code, content={
        "error": {"code": exc.headers["X-Error-Code"], "message": exc.detail, "path": request.url.path}
    })
```

### Structured Logging

```python
import structlog
logger = structlog.get_logger(__name__)

@router.post("/filter/execute")
async def execute_filter(rule: FilterRule):
    logger.info("Executing filter", rule_name=rule.name)
    try:
        result = await engine.execute(rule)
        logger.info("Filter executed", suspicious_count=result.count)
        return result
    except ValueError as e:
        logger.warning("Invalid filter rule", error=str(e))
        raise InvalidExpressionException(expression=rule.expression, reason=str(e))
```

**For details:** [error-handling.md](references/error-handling.md)

---

## Testing with pytest

### Database Test Fixtures

```python
import pytest
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def test_db():
    with PostgresContainer("postgis/postgis:18-3.5") as postgres:
        yield postgres.get_connection_url()

@pytest.fixture
def db_session(test_db):
    conn = psycopg2.connect(test_db)
    conn.execute("BEGIN")
    yield conn
    conn.execute("ROLLBACK")
    conn.close()
```

### API Testing

```python
from fastapi.testclient import TestClient

@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

def test_create_track(client):
    response = client.post("/api/tracks", json={
        "pigeon_number": "TW-2025-001",
        "race_id": 1,
        "total_points": 500
    })
    assert response.status_code == 201
    assert response.json()["pigeon_number"] == "TW-2025-001"
```

### Parametrized Tests

```python
@pytest.mark.parametrize("expression,valid", [
    ("altitude > 100", True),
    ("altitude - elevation_dem < 20", True),
    ("DROP TABLE tracks", False),
    ("__import__('os').system('ls')", False),
])
def test_expression_security(expression, valid):
    validator = ExpressionValidator()
    result = validator.validate(expression)
    assert result['valid'] == valid
```

**For details:** [testing-pytest.md](references/testing-pytest.md)

---

## Type Safety

### Basic Type Hints

```python
from typing import List, Dict, Optional, Any

def get_tracks(race_id: int) -> List[Dict[str, Any]]:
    return db.query("SELECT * FROM tracks WHERE race_id = %s", (race_id,))

def get_track(track_id: int) -> Optional[Dict[str, Any]]:
    return db.query_one("SELECT * FROM tracks WHERE id = %s", (track_id,))
```

### mypy Configuration

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.14"
warn_return_any = true
check_untyped_defs = true
no_implicit_optional = true

[[tool.mypy.overrides]]
module = "psycopg2.*"
ignore_missing_imports = true
```

### Protocol Classes (Duck Typing)

```python
from typing import Protocol

class Repository(Protocol):
    def get(self, id: int) -> Optional[Dict]: ...
    def list(self) -> List[Dict]: ...

def process_repo(repo: Repository) -> None:
    items = repo.list()  # Type-safe, works with any matching class
```

**For details:** [type-safety.md](references/type-safety.md)

---

## Production Checklist

### Security
- [ ] CORS configured for production (not allow_origins=["*"])
- [ ] Expression validator uses AST parsing (not eval)
- [ ] Database credentials from environment variables
- [ ] API keys/tokens validated
- [ ] Input validation with Pydantic

### Performance
- [ ] Connection pooling enabled (psycopg3 AsyncConnectionPool)
- [ ] GIST indexes on PostGIS geometry columns
- [ ] Batch updates using execute_values
- [ ] Response models exclude sensitive fields
- [ ] Database queries use LIMIT/OFFSET for pagination

### Error Handling
- [ ] Global exception handlers registered
- [ ] Custom exceptions with error codes
- [ ] Structured logging (JSON in production)
- [ ] Request ID tracking middleware
- [ ] Sentry or error monitoring integrated

### Testing
- [ ] pytest fixtures for database isolation
- [ ] API tests with TestClient
- [ ] Coverage >= 80%
- [ ] Integration tests for critical flows
- [ ] CI/CD runs mypy + pytest

### Type Safety
- [ ] mypy configuration file (pyproject.toml)
- [ ] Route handlers have return type annotations
- [ ] Pydantic v2 validators used
- [ ] No implicit Optional types
- [ ] Protocol classes for interfaces

---

## Current Project Analysis

**Project:** Pigeon Racing Track Filter System (`/Users/tf/Downloads/軌跡filter/`)

**Architecture:** `src/api/main.py` (single-file API), `src/core/` (business logic), `src/db/database.py` (repository)

**Strengths:** Type annotations, safe AST evaluation, repository pattern, Pydantic validation, PostGIS queries

**Improvements:**
- **High Priority:** Connection pooling, explicit return types, mypy config, pytest fixtures, production CORS
- **Medium Priority:** Modular routers (15+ endpoints), structured logging, custom exceptions, dependency injection
- **Low Priority:** Async migration (psycopg3), API versioning, request ID tracking, error monitoring

**Adding new auxiliary field:**
1. Update `sql/init.sql`, `auxiliary_calculator.py`, `expression_evaluator.py` ALLOWED_FIELDS, API model, GPX spec

---

## Common Patterns in This Project

### Expression Validation (Security Critical)

```python
class ExpressionValidator:
    ALLOWED_FIELDS = {'altitude', 'speed', 'moving_speed', ...}
    def validate(self, expression: str) -> Dict[str, Any]:
        if len(expression) > 500: raise ValueError("Expression too long")
        tree = ast.parse(expression, mode='eval')
        fields = self._extract_fields(tree)
        if invalid := fields - self.ALLOWED_FIELDS:
            raise ValueError(f"Disallowed fields: {invalid}")
        return {'valid': True, 'fields': list(fields)}
```

### Repository Pattern

```python
class TrackRepository:
    def __init__(self, db: Database): self.db = db
    def get_race_tracks(self, race_id: int) -> List[Dict]:
        return self.db.query("SELECT * FROM tracks WHERE race_id = %s", (race_id,))
    def get_track_points(self, track_id: int) -> List[Dict]:
        return self.db.query("SELECT * FROM track_points WHERE track_id = %s ORDER BY timestamp", (track_id,))
```

### PostGIS Spatial Operations

```python
sql = """UPDATE track_points tp SET on_highway = COALESCE(
    (SELECT TRUE FROM highways h WHERE ST_DWithin(tp.geom::geography, h.geom::geography, 20) LIMIT 1), FALSE)
WHERE tp.track_id = %s"""
```

---

## Reference Documentation

### Comprehensive Guides
- [FastAPI Routing and API Design](references/fastapi-routing.md) - Router organization, dependency injection, versioning, middleware
- [Pydantic Models and Validation](references/pydantic-models.md) - v2 migration, validators, serialization, ConfigDict
- [PostgreSQL + PostGIS Patterns](references/postgresql-postgis.md) - Connection pooling, spatial queries, indexing, repository pattern
- [Error Handling and Logging](references/error-handling.md) - Custom exceptions, global handlers, structured logging, monitoring
- [Testing with pytest](references/testing-pytest.md) - Fixtures, database testing, API testing, parametrization, coverage
- [Type Safety with mypy](references/type-safety.md) - mypy configuration, type hints, protocols, common errors

### Official Documentation
- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [Pydantic v2 Documentation](https://docs.pydantic.dev/latest/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [pytest Documentation](https://docs.pytest.org/)
- [mypy Documentation](http://mypy-lang.org/)

### Production Examples
- [Netflix Dispatch](https://github.com/Netflix/dispatch) - Real-world FastAPI architecture
- [fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) - Comprehensive patterns

---

## 如何觸發此技能

### 自動觸發

當你在 Claude Code 中輸入包含以下關鍵詞的請求時，UserPromptSubmit Hook 會自動推薦此技能：

**英文關鍵詞**（30+）:
- fastapi, pydantic, postgresql, postgis, psycopg2
- api endpoint, router, middleware, cors
- request validation, response model, dependency injection
- field validator, model validator, database session
- error handling, structured logging, async database
- spatial query, geography, geometry, gist index
- pytest, mypy, type hint, test fixture
- parametrize, async test, transaction, connection pool

**中文關鍵詞**（30+）:
- **動詞**：添加, 創建, 新增, 修改, 更新, 實現, 實作, 構建, 編寫, 開發, 幫我, 請
- **技術術語**：路由, 端點, 接口, 後端, 服務, API, 數據庫, 資料庫, 驗證, 校驗, 類型檢查, 錯誤處理, 異常處理, 異步, 非同步, 測試, 單元測試, 中間件

### 手動啟用

```bash
# 使用 Skill tool
Skill(skill="python-fastapi-guidelines")
```

### 推薦輸入示例

✅ **觸發率高**：
- "幫我添加一個 FastAPI endpoint 處理用戶註冊，需要 Pydantic 驗證"
- "創建一個新的 POST 路由來處理 GPX 文件上傳"
- "實現一個 PostGIS 空間查詢功能來計算距離"
- "如何在 FastAPI 中使用依賴注入管理數據庫連接？"
- "添加 async 數據庫操作和錯誤處理"

⚠️ **觸發率低**：
- "寫個登錄功能"（太模糊，缺少技術關鍵詞）
- "做個後端"（缺少具體框架和任務描述）
- "處理數據"（太通用）

### 技能觸發機制

此技能通過以下方式被觸發：
1. **關鍵詞匹配**：輸入包含上述英文或中文關鍵詞
2. **意圖模式匹配**：匹配如 `(create|add|添加|創建).*?(api|endpoint|路由)` 的模式
3. **文件路徑觸發**：編輯 `src/api/*.py`, `src/core/*.py`, `src/db/*.py` 等文件
4. **代碼內容觸發**：文件包含 `from fastapi import`, `@app.get`, `ST_Distance` 等

**推薦使用方式**：
- 在輸入中明確提及 FastAPI、Pydantic 或 PostgreSQL
- 使用具體的技術術語（如「endpoint」、「路由」、「驗證」）
- 描述具體的功能需求而非模糊的目標

---

**Skill Version:** 1.0
**Last Updated:** 2025-11-11
**Python Version:** 3.8+
**FastAPI Version:** 0.100+
**Pydantic Version:** 2.0+
