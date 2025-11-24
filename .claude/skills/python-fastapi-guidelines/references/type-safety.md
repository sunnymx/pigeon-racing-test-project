# Type Safety with mypy and Type Hints

## Table of Contents

1. [Overview](#1-overview)
2. [Current Project Type Hints](#2-current-project-type-hints)
3. [mypy Configuration for FastAPI](#3-mypy-configuration-for-fastapi)
4. [Type Hints Best Practices](#4-type-hints-best-practices)
5. [Common Type Errors and Solutions](#5-common-type-errors-and-solutions)
6. [FastAPI-Specific Typing Patterns](#6-fastapi-specific-typing-patterns)
7. [Protocol Classes (Duck Typing)](#7-protocol-classes-duck-typing)
8. [Generic Types](#8-generic-types)
9. [Project Integration](#9-project-integration)
10. [Common Pitfalls](#10-common-pitfalls)
11. [Reference Links](#11-reference-links)

---

## 1. Overview

Type hints and mypy provide static type checking for Python, catching type-related errors before runtime. This is especially valuable in FastAPI applications where request/response models, database queries, and dependency injection benefit from strong typing.

**Why Type Safety Matters:**

- **Early Error Detection**: Catch type errors during development, not production
- **Better IDE Support**: Autocomplete, refactoring, and inline documentation
- **Self-Documenting Code**: Type annotations serve as inline documentation
- **Safer Refactoring**: Confidence when changing code structure
- **FastAPI Integration**: Type hints drive automatic validation and OpenAPI generation

**Type Checking Process:**

```
Write Code → mypy Checks Types → Fix Errors → Deploy with Confidence
```

---

## 2. Current Project Type Hints

### Analysis of Project Type Annotation Usage

**Current State (as of 2025-11-10):**

The project demonstrates **good type annotation coverage** with consistent patterns across modules:

#### src/api/main.py

```python
from typing import List, Dict, Any, Optional

# ✅ Route handler with return type
@app.get("/api/races/{race_id}/tracks")
def get_race_tracks_with_points(race_id: int):
    """Type hint on parameter, implicit return type"""
    try:
        repo = TrackRepository(db)
        result = repo.get_race_tracks_with_points(race_id)
        return result  # Returns Dict (could be explicit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")

# ✅ Pydantic models with type hints
class FilterExecuteRequest(BaseModel):
    race_id: int
    rule: Dict[str, Any]

# ⚠️ Could be improved: Add explicit return type
@app.post("/api/filter/execute")
def execute_filter(request: FilterExecuteRequest):
    # Should be: -> Dict[str, Any]
    pass
```

#### src/db/database.py

```python
from typing import List, Dict, Any, Optional

class Database:
    # ✅ Method with full type annotations
    def query(self, sql: str, params: tuple = None) -> List[Dict]:
        """Returns list of dictionaries"""
        pass

    # ✅ Optional return type
    def query_one(self, sql: str, params: tuple = None) -> Optional[Dict]:
        """Returns single record or None"""
        pass

class TrackRepository:
    # ✅ Constructor with type hint
    def __init__(self, db: Database):
        self.db = db

    # ✅ Return type annotation
    def get_race_tracks(self, race_id: int) -> List[Dict]:
        """Well-typed method"""
        pass
```

#### src/core/expression_evaluator.py

```python
from typing import Dict, Any, Set

class ExpressionValidator:
    # ✅ Method with return type annotation
    def validate(self, expression: str) -> Dict[str, Any]:
        """Returns validation result dictionary"""
        pass

    # ✅ Private method with type hints
    def _extract_fields(self, tree) -> Set[str]:
        """Returns set of field names"""
        pass

class ExpressionEvaluator:
    # ✅ Generic return type
    def evaluate(self, expression: str, context: Dict[str, Any]) -> Any:
        """Could evaluate to any type"""
        pass
```

**Strengths:**

- ✅ Consistent use of `Optional[T]` for nullable fields
- ✅ Generic collections typed (`List[Dict]`, `Dict[str, Any]`)
- ✅ Pydantic models with field type annotations
- ✅ Database methods with explicit return types
- ✅ Private methods include type hints

**Areas for Improvement:**

- ⚠️ Route handlers missing explicit return types (implicit Dict)
- ⚠️ Some methods use `Any` where more specific types possible
- ⚠️ Context managers could benefit from `Generator` type hints
- ⚠️ No mypy configuration file (pyproject.toml or mypy.ini)

---

## 3. mypy Configuration for FastAPI

### Basic Configuration (pyproject.toml)

**Recommended for this project:**

```toml
[tool.mypy]
# Python version
python_version = "3.14"

# Basic checks
warn_return_any = true
warn_unused_configs = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
check_untyped_defs = true
strict_equality = true

# Optional can't be implicit (must use Optional[T] or T | None)
no_implicit_optional = true

# Relax these for FastAPI compatibility
disallow_untyped_defs = false  # Set to true after adding all type hints
disallow_any_unimported = false

# Per-module options
[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
ignore_errors = false

[[tool.mypy.overrides]]
module = "scripts.*"
ignore_errors = true

# Third-party libraries without type stubs
[[tool.mypy.overrides]]
module = [
    "psycopg2.*",
    "uvicorn.*",
    "leaflet.*",
]
ignore_missing_imports = true
```

### Alternative: mypy.ini

```ini
[mypy]
python_version = 3.14
warn_return_any = True
warn_unused_configs = True
warn_redundant_casts = True
warn_unused_ignores = True
check_untyped_defs = True
no_implicit_optional = True

[mypy-psycopg2.*]
ignore_missing_imports = True

[mypy-uvicorn.*]
ignore_missing_imports = True

[mypy-tests.*]
disallow_untyped_defs = False
```

### Running mypy

```bash
# Check entire project
mypy src/

# Check specific module
mypy src/core/filter_engine.py

# Check with strict mode (for mature codebases)
mypy --strict src/

# Generate HTML coverage report
mypy src/ --html-report mypy-report/

# Check changed files only (in Git)
git diff --name-only | grep "\.py$" | xargs mypy

# Integrate with CI/CD
mypy src/ --junit-xml mypy-results.xml
```

### FastAPI-Specific Settings

```toml
[tool.mypy]
# Allow decorator to modify function signature
# (FastAPI uses Depends(), Body(), Query() decorators)
plugins = ["pydantic.mypy"]

[tool.pydantic-mypy]
init_forbid_extra = true
init_typed = true
warn_required_dynamic_aliases = true
warn_untyped_fields = true
```

### Strictness Levels

**Level 1: Gentle (Recommended for existing projects)**

```toml
[tool.mypy]
check_untyped_defs = true
warn_return_any = true
warn_unused_ignores = true
```

**Level 2: Medium (For new modules)**

```toml
[tool.mypy]
disallow_untyped_defs = true
warn_return_any = true
check_untyped_defs = true
no_implicit_optional = true
```

**Level 3: Strict (For mission-critical code)**

```toml
[tool.mypy]
strict = true  # Enables all optional checks
```

---

## 4. Type Hints Best Practices

### Optional Types for Nullable Fields

```python
from typing import Optional

# ❌ WRONG: Type mismatch
class Track(BaseModel):
    description: str = None  # mypy error: incompatible types

# ✅ CORRECT: Explicit Optional
class Track(BaseModel):
    description: Optional[str] = None

# ✅ BETTER: Python 3.10+ union syntax
class Track(BaseModel):
    description: str | None = None
```

### Generic Collections

```python
from typing import List, Dict, Set, Tuple, Any

# ❌ WRONG: Untyped collections
def get_tracks() -> list:  # What's in the list?
    return []

def get_metadata() -> dict:  # What keys? What values?
    return {}

# ✅ CORRECT: Typed collections
def get_tracks() -> List[Dict[str, Any]]:
    """Returns list of track dictionaries"""
    return []

def get_track_ids() -> Set[int]:
    """Returns unique track IDs"""
    return {1, 2, 3}

def get_point_data() -> Tuple[float, float, float]:
    """Returns (lat, lng, altitude)"""
    return (24.5, 121.0, 125.5)

# ✅ BEST: Use domain models
from pydantic import BaseModel

class Track(BaseModel):
    id: int
    pigeon_number: str
    total_points: int

def get_tracks() -> List[Track]:
    """Strongly typed with Pydantic"""
    return [Track(...), Track(...)]
```

### Function Signatures

```python
from typing import Optional, List, Dict, Any

# ❌ WRONG: Missing type hints
def process_track(track_id, include_points=False):
    pass

# ✅ CORRECT: Full type annotations
def process_track(
    track_id: int,
    include_points: bool = False
) -> Dict[str, Any]:
    """Process track and return result dictionary"""
    return {"track_id": track_id, "processed": True}

# ✅ BETTER: More specific return type
class TrackResult(BaseModel):
    track_id: int
    processed: bool
    points: Optional[List[Dict[str, float]]] = None

def process_track(
    track_id: int,
    include_points: bool = False
) -> TrackResult:
    """Strongly typed return"""
    return TrackResult(track_id=track_id, processed=True)
```

### Variable Annotations

```python
from typing import List, Dict, Optional

# ✅ Explicit variable annotations (useful when type can't be inferred)
tracks: List[Dict[str, Any]] = []
current_track: Optional[Dict] = None
confidence_scores: Dict[int, float] = {}

# For complex types
from typing import Callable

validator: Callable[[str], bool] = lambda x: len(x) > 0
```

### Class Attributes

```python
from typing import ClassVar, Optional

class TrackRepository:
    # Class variable (shared across instances)
    connection_pool: ClassVar[Optional[ConnectionPool]] = None

    # Instance variable
    db: Database

    def __init__(self, db: Database) -> None:
        self.db = db
```

### Union Types

```python
from typing import Union

# Python 3.9 and below
def parse_value(value: Union[int, str, float]) -> str:
    return str(value)

# Python 3.10+ (preferred)
def parse_value(value: int | str | float) -> str:
    return str(value)

# Optional is just Union[T, None]
from typing import Optional

# These are equivalent:
def get_track(id: int) -> Optional[Dict]:
    pass

def get_track(id: int) -> Dict | None:
    pass
```

---

## 5. Common Type Errors and Solutions

### Error 1: Incompatible Return Type

```python
# ❌ mypy error: Incompatible return value type
def get_track(track_id: int) -> Dict[str, Any]:
    result = db.query_one("SELECT * FROM tracks WHERE id = %s", (track_id,))
    return result  # Error: query_one returns Optional[Dict]

# ✅ Solution 1: Handle None case
def get_track(track_id: int) -> Dict[str, Any]:
    result = db.query_one("SELECT * FROM tracks WHERE id = %s", (track_id,))
    if result is None:
        raise ValueError(f"Track {track_id} not found")
    return result

# ✅ Solution 2: Change return type
def get_track(track_id: int) -> Optional[Dict[str, Any]]:
    return db.query_one("SELECT * FROM tracks WHERE id = %s", (track_id,))
```

### Error 2: Union Types in FastAPI response_model

```python
from typing import Union
from pydantic import BaseModel

class SuccessResponse(BaseModel):
    status: str
    data: Dict[str, Any]

class ErrorResponse(BaseModel):
    status: str
    error: str

# ❌ May cause mypy issues with FastAPI decorators
@router.get("/data", response_model=Union[SuccessResponse, ErrorResponse])
async def get_data():
    pass

# ✅ Solution 1: Use type: ignore
@router.get("/data")  # type: ignore[misc]
async def get_data() -> Union[SuccessResponse, ErrorResponse]:
    pass

# ✅ Solution 2: Single response type with optional fields
class Response(BaseModel):
    status: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.get("/data", response_model=Response)
async def get_data() -> Response:
    pass
```

### Error 3: None Value in Operations

```python
# ❌ mypy error: Unsupported operand types
def calculate_agl(altitude: Optional[float], elevation: Optional[float]) -> float:
    return altitude - elevation  # Error: operands could be None

# ✅ Solution: Check for None
def calculate_agl(
    altitude: Optional[float],
    elevation: Optional[float]
) -> Optional[float]:
    if altitude is None or elevation is None:
        return None
    return altitude - elevation
```

### Error 4: Missing Type Stubs for Third-Party Libraries

```
error: Library stubs not installed for "psycopg2"
note: See https://mypy.readthedocs.io/en/stable/running_mypy.html#missing-imports
```

**Solution: Add to mypy configuration**

```toml
[[tool.mypy.overrides]]
module = "psycopg2.*"
ignore_missing_imports = true
```

### Error 5: Async Generator Types

```python
from typing import AsyncGenerator

# ❌ WRONG: Missing yield type
async def get_db():
    async with SessionLocal() as session:
        yield session  # mypy can't infer type

# ✅ CORRECT: Explicit generator type
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
```

### Error 6: Type Narrowing Required

```python
from typing import Union

# ❌ mypy error: Union[int, str] has no attribute 'upper'
def process_value(value: Union[int, str]) -> str:
    return value.upper()  # Error: int doesn't have upper()

# ✅ Solution: Type narrowing with isinstance
def process_value(value: Union[int, str]) -> str:
    if isinstance(value, str):
        return value.upper()  # mypy knows value is str here
    else:
        return str(value)  # mypy knows value is int here
```

---

## 6. FastAPI-Specific Typing Patterns

### Dependency Injection with Type Hints

```python
from typing import Annotated
from fastapi import Depends
from src.db.database import Database

# Current project pattern (implicit type)
@app.get("/api/races/{race_id}/tracks")
def get_race_tracks_with_points(race_id: int):
    db = Database()  # Created in route
    repo = TrackRepository(db)
    return repo.get_race_tracks_with_points(race_id)

# ✅ IMPROVED: Dependency with type hint
def get_db() -> Database:
    """Dependency that provides Database instance"""
    db = Database()
    try:
        yield db
    finally:
        pass  # Add cleanup if needed

@app.get("/api/races/{race_id}/tracks")
def get_race_tracks_with_points(
    race_id: int,
    db: Annotated[Database, Depends(get_db)]
) -> Dict[str, Any]:
    # mypy knows db is Database
    repo = TrackRepository(db)
    return repo.get_race_tracks_with_points(race_id)

# Alternative (FastAPI 0.95+)
@app.get("/api/races/{race_id}/tracks")
def get_race_tracks_with_points(
    race_id: int,
    db: Database = Depends(get_db)
) -> Dict[str, Any]:
    repo = TrackRepository(db)
    return repo.get_race_tracks_with_points(race_id)
```

### Request Body Typing

```python
from typing import Annotated
from fastapi import Body
from pydantic import BaseModel, Field

# Current project pattern
class FilterExecuteRequest(BaseModel):
    race_id: int
    rule: Dict[str, Any]

@app.post("/api/filter/execute")
def execute_filter(request: FilterExecuteRequest):
    # Type is inferred from parameter annotation
    pass

# ✅ ENHANCED: Add return type and examples
@app.post("/api/filter/execute")
def execute_filter(
    request: Annotated[
        FilterExecuteRequest,
        Body(
            example={
                "race_id": 1,
                "rule": {
                    "conditions": [...],
                    "threshold": {"min_occurrences": 2}
                }
            }
        )
    ]
) -> Dict[str, Any]:
    """mypy knows request is FilterExecuteRequest"""
    engine = FilterEngine(db)
    result = engine.execute_filter(request.race_id, request.rule)
    return result
```

### Query Parameters with Validation

```python
from typing import Annotated, Optional
from fastapi import Query

# ✅ Fully typed query parameters
@app.get("/api/tracks")
def get_tracks(
    race_id: Annotated[int, Query(gt=0, description="Race ID")] = 1,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
    search: Annotated[Optional[str], Query(max_length=100)] = None
) -> List[Dict[str, Any]]:
    """All parameters properly typed and validated"""
    tracks = track_service.list(
        race_id=race_id,
        page=page,
        page_size=page_size,
        search=search
    )
    return tracks
```

### Path Parameters

```python
from typing import Annotated
from fastapi import Path

@app.get("/api/races/{race_id}/tracks/{track_id}")
def get_track_detail(
    race_id: Annotated[int, Path(gt=0, description="Race ID")],
    track_id: Annotated[int, Path(gt=0, description="Track ID")],
    include_points: bool = False
) -> Dict[str, Any]:
    """Path parameters with validation"""
    pass
```

### Response Model Typing

```python
from pydantic import BaseModel
from typing import List

class TrackResponse(BaseModel):
    id: int
    pigeon_number: str
    total_points: int

# ✅ Explicit response model
@app.get("/api/tracks/{track_id}", response_model=TrackResponse)
def get_track(track_id: int) -> TrackResponse:
    """FastAPI validates response against TrackResponse schema"""
    track = track_repo.get(track_id)
    return TrackResponse(**track)

# For lists
@app.get("/api/tracks", response_model=List[TrackResponse])
def get_tracks() -> List[TrackResponse]:
    tracks = track_repo.list()
    return [TrackResponse(**t) for t in tracks]
```

---

## 7. Protocol Classes (Duck Typing)

Protocol classes enable structural subtyping (duck typing) with type safety.

### Basic Protocol

```python
from typing import Protocol

class Filterable(Protocol):
    """Any object with a matches() method is Filterable"""

    def matches(self, condition: str) -> bool:
        """Check if object matches condition"""
        ...

# No need to inherit from Filterable
class Track:
    def matches(self, condition: str) -> bool:
        return self.pigeon_number == condition

class Race:
    def matches(self, condition: str) -> bool:
        return self.name == condition

# Works with any Filterable object
def filter_items(items: List[Filterable], condition: str) -> List[Filterable]:
    return [item for item in items if item.matches(condition)]

# Both Track and Race work
tracks: List[Track] = [Track(), Track()]
races: List[Race] = [Race(), Race()]

filtered_tracks = filter_items(tracks, "TW-001")  # ✅ Works
filtered_races = filter_items(races, "Spring Cup")  # ✅ Works
```

### Protocol for Repository Pattern

```python
from typing import Protocol, TypeVar, Generic, List, Optional

T = TypeVar('T')

class Repository(Protocol[T]):
    """Protocol for repository pattern"""

    def get(self, id: int) -> Optional[T]:
        """Get single item by ID"""
        ...

    def list(self, skip: int = 0, limit: int = 100) -> List[T]:
        """List items with pagination"""
        ...

    def create(self, obj: T) -> T:
        """Create new item"""
        ...

# Implementation doesn't need to inherit Protocol
class TrackRepository:
    def get(self, id: int) -> Optional[Dict]:
        return self.db.query_one("SELECT * FROM tracks WHERE id = %s", (id,))

    def list(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        sql = "SELECT * FROM tracks LIMIT %s OFFSET %s"
        return self.db.query(sql, (limit, skip))

    def create(self, obj: Dict) -> Dict:
        # Insert and return
        pass

# Works with Protocol
def process_repository(repo: Repository[Dict]) -> None:
    items = repo.list()  # mypy validates this
    for item in items:
        print(item)

track_repo = TrackRepository(db)
process_repository(track_repo)  # ✅ Type checks pass
```

### Database Protocol

```python
from typing import Protocol, List, Dict, Optional

class DatabaseProtocol(Protocol):
    """Protocol for database interface"""

    def query(self, sql: str, params: tuple = None) -> List[Dict]:
        ...

    def query_one(self, sql: str, params: tuple = None) -> Optional[Dict]:
        ...

    def execute(self, sql: str, params: tuple = None) -> None:
        ...

# Any class implementing these methods works
def count_tracks(db: DatabaseProtocol) -> int:
    result = db.query_one("SELECT COUNT(*) as count FROM tracks")
    return result['count'] if result else 0
```

---

## 8. Generic Types

### TypeVar for Generic Functions

```python
from typing import TypeVar, List

T = TypeVar('T')

def first_or_none(items: List[T]) -> T | None:
    """Return first item or None. Type is preserved."""
    return items[0] if items else None

# mypy infers return type based on input
tracks: List[Dict] = [{"id": 1}, {"id": 2}]
first_track: Dict | None = first_or_none(tracks)  # Type is Dict | None

numbers: List[int] = [1, 2, 3]
first_number: int | None = first_or_none(numbers)  # Type is int | None
```

### Generic Classes

```python
from typing import TypeVar, Generic, List, Optional, Type

ModelType = TypeVar('ModelType')

class BaseRepository(Generic[ModelType]):
    """Type-safe base repository"""

    def __init__(self, model: Type[ModelType], db: Database) -> None:
        self.model = model
        self.db = db

    def get(self, id: int) -> Optional[ModelType]:
        """Get single record - return type matches ModelType"""
        sql = f"SELECT * FROM {self.model.__tablename__} WHERE id = %s"
        result = self.db.query_one(sql, (id,))
        if result:
            return self.model(**result)
        return None

    def list(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """List records - return type is List[ModelType]"""
        sql = f"SELECT * FROM {self.model.__tablename__} LIMIT %s OFFSET %s"
        results = self.db.query(sql, (limit, skip))
        return [self.model(**r) for r in results]

    def create(self, obj: ModelType) -> ModelType:
        """Create record - return type matches ModelType"""
        # Implementation
        return obj

# Usage with strong typing
from pydantic import BaseModel

class Track(BaseModel):
    id: int
    pigeon_number: str
    total_points: int

# Create typed repository
track_repo: BaseRepository[Track] = BaseRepository(Track, db)

# mypy knows exact return types
track: Optional[Track] = track_repo.get(1)  # Type is Optional[Track]
tracks: List[Track] = track_repo.list()     # Type is List[Track]
```

### Applying to Project

```python
from typing import TypeVar, Generic, Dict, List, Optional
from src.db.database import Database

T = TypeVar('T')

class TypedRepository(Generic[T]):
    """Generic repository for project"""

    def __init__(self, db: Database, table_name: str) -> None:
        self.db = db
        self.table_name = table_name

    def get_by_id(self, id: int) -> Optional[Dict]:
        """Currently returns Dict, could be made more type-safe"""
        sql = f"SELECT * FROM {self.table_name} WHERE id = %s"
        return self.db.query_one(sql, (id,))

    def list_all(self) -> List[Dict]:
        """List all records"""
        sql = f"SELECT * FROM {self.table_name}"
        return self.db.query(sql)

# Specialized repositories
class TrackRepository(TypedRepository[Dict]):
    def __init__(self, db: Database) -> None:
        super().__init__(db, "tracks")

    def get_by_race(self, race_id: int) -> List[Dict]:
        """Track-specific method"""
        sql = "SELECT * FROM tracks WHERE race_id = %s"
        return self.db.query(sql, (race_id,))
```

---

## 9. Project Integration

### Step 1: Install mypy

```bash
# Activate virtual environment
source venv/bin/activate  # Mac/Linux

# Install mypy
pip install mypy

# Verify installation
mypy --version
```

### Step 2: Create mypy Configuration

**Option A: Add to pyproject.toml**

```toml
[tool.mypy]
python_version = "3.14"
warn_return_any = true
warn_unused_configs = true
check_untyped_defs = true
no_implicit_optional = true

# Third-party libraries
[[tool.mypy.overrides]]
module = ["psycopg2.*", "uvicorn.*"]
ignore_missing_imports = true

# Tests can be less strict
[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

**Option B: Create mypy.ini**

```ini
[mypy]
python_version = 3.14
warn_return_any = True
check_untyped_defs = True

[mypy-psycopg2.*]
ignore_missing_imports = True

[mypy-uvicorn.*]
ignore_missing_imports = True
```

### Step 3: Run Initial Check

```bash
# Check src/ directory
mypy src/

# Expected output (first run):
# src/api/main.py:89: error: Function is missing a return type annotation
# src/core/filter_engine.py:19: error: Function is missing a return type annotation
# Found 12 errors in 5 files (checked 9 source files)
```

### Step 4: Fix Type Errors Incrementally

**Priority Order:**

1. **Add return types to route handlers**

```python
# Before
@app.get("/api/races/{race_id}/tracks")
def get_race_tracks_with_points(race_id: int):
    pass

# After
@app.get("/api/races/{race_id}/tracks")
def get_race_tracks_with_points(race_id: int) -> Dict[str, Any]:
    pass
```

2. **Add return types to database methods**

```python
# Already done in project! ✅
def query(self, sql: str, params: tuple = None) -> List[Dict]:
    pass
```

3. **Add return types to core logic**

```python
# Before
def execute_filter(self, race_id: int, rule_json: dict):
    pass

# After
def execute_filter(self, race_id: int, rule_json: dict) -> Dict[str, Any]:
    pass
```

### Step 5: Integrate with CI/CD

**Add to GitHub Actions workflow:**

```yaml
name: Type Check

on: [push, pull_request]

jobs:
  mypy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.14'
      - name: Install dependencies
        run: |
          pip install mypy
          pip install -r requirements.txt
      - name: Run mypy
        run: mypy src/
```

### Step 6: Pre-commit Hook (Optional)

```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "Running mypy..."
mypy src/
if [ $? -ne 0 ]; then
    echo "mypy check failed. Commit aborted."
    exit 1
fi
```

---

## 10. Common Pitfalls

### Pitfall 1: Using Any Too Liberally

```python
from typing import Any

# ❌ WRONG: Defeats purpose of type checking
def process_data(data: Any) -> Any:
    return data.do_something()  # No type safety!

# ✅ CORRECT: Use specific types
from typing import Dict

def process_data(data: Dict[str, Any]) -> Dict[str, Any]:
    # At least we know it's a dictionary
    return {"result": data.get("value", 0) * 2}

# ✅ BEST: Use domain models
from pydantic import BaseModel

class InputData(BaseModel):
    value: int

class OutputData(BaseModel):
    result: int

def process_data(data: InputData) -> OutputData:
    return OutputData(result=data.value * 2)
```

### Pitfall 2: Not Handling None in Optional Types

```python
# ❌ WRONG: Doesn't check for None
def get_track_name(track: Optional[Dict]) -> str:
    return track['pigeon_number']  # Error if track is None!

# ✅ CORRECT: Handle None case
def get_track_name(track: Optional[Dict]) -> str:
    if track is None:
        return "Unknown"
    return track.get('pigeon_number', 'Unknown')

# ✅ BETTER: Early return pattern
def get_track_name(track: Optional[Dict]) -> str:
    if track is None:
        return "Unknown"

    return track.get('pigeon_number', 'Unknown')
```

### Pitfall 3: Mixing Sync and Async Types

```python
from typing import Awaitable

# ❌ WRONG: Says it returns Awaitable but doesn't
def get_track() -> Awaitable[Dict]:
    return {"id": 1}  # Type error!

# ✅ CORRECT: Match async/sync
async def get_track() -> Dict:
    return await fetch_track()

# OR for sync
def get_track() -> Dict:
    return fetch_track_sync()
```

### Pitfall 4: Ignoring Context Manager Types

```python
from typing import Generator, ContextManager
from contextlib import contextmanager

# ❌ WRONG: Missing return type
@contextmanager
def get_connection():
    conn = create_connection()
    try:
        yield conn
    finally:
        conn.close()

# ✅ CORRECT: Explicit generator type
@contextmanager
def get_connection() -> Generator[Connection, None, None]:
    conn = create_connection()
    try:
        yield conn
    finally:
        conn.close()
```

### Pitfall 5: Incorrect Dict Key Types

```python
# ❌ WRONG: Assumes keys are always strings
def get_value(data: Dict[str, Any], key: str) -> Any:
    return data[key]

# But called with:
config: Dict[int, str] = {1: "value"}
get_value(config, 1)  # Type error: expected str, got int

# ✅ CORRECT: Generic key type
from typing import TypeVar

K = TypeVar('K')
V = TypeVar('V')

def get_value(data: Dict[K, V], key: K) -> V | None:
    return data.get(key)
```

---

## 11. Reference Links

### Official Documentation

- **Python Type Hints**: https://docs.python.org/3/library/typing.html
- **mypy Documentation**: http://mypy-lang.org/
- **FastAPI Type Hints**: https://fastapi.tiangolo.com/python-types/
- **Pydantic Type Hints**: https://docs.pydantic.dev/latest/concepts/types/

### Guides and Tutorials

- **mypy Practical Guide**: https://learnbatta.com/blog/mypy-practical-guide/
- **FastAPI Type Hints Tutorial**: https://www.tutorialspoint.com/fastapi/fastapi_type_hints.htm
- **Python Type Checking Guide**: https://realpython.com/python-type-checking/

### Tools

- **mypy Playground**: http://mypy-play.net/
- **Pydantic mypy Plugin**: https://docs.pydantic.dev/latest/integrations/mypy/

### Best Practices

- **Type Hints Cheat Sheet**: https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html
- **FastAPI Best Practices**: https://github.com/zhanymkanov/fastapi-best-practices

---

**Document Version**: 1.0
**Last Updated**: 2025-11-10
**Python Version**: 3.14+
**mypy Version**: 1.0+
**FastAPI Version**: 0.100+
