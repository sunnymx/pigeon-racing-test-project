# Testing with pytest

## Table of Contents

1. [Overview](#1-overview)
2. [Current Project Tests](#2-current-project-tests)
3. [Pytest Fixture Organization](#3-pytest-fixture-organization)
4. [Database Testing Strategies](#4-database-testing-strategies)
5. [API Testing with TestClient](#5-api-testing-with-testclient)
6. [Parametrization Patterns](#6-parametrization-patterns)
7. [Coverage Strategies](#7-coverage-strategies)
8. [PostGIS Testing](#8-postgis-testing)
9. [Project Testing Guide](#9-project-testing-guide)
10. [Common Pitfalls](#10-common-pitfalls)
11. [Reference Links](#11-reference-links)

---

## 1. Overview

Testing is critical for maintaining quality in FastAPI applications. This guide covers pytest best practices specifically for Python/FastAPI projects with PostgreSQL/PostGIS databases.

**Key Testing Principles:**
- **Isolation**: Each test should be independent
- **Fast Execution**: Use fixtures efficiently, mock when appropriate
- **Readable**: Test names should describe behavior, not implementation
- **Comprehensive**: Cover edge cases, boundaries, and error conditions
- **Maintainable**: Use fixtures and parametrization to reduce duplication

**Testing Pyramid:**
```
        /\
       /  \      E2E Tests (Few)
      /____\
     /      \    Integration Tests (Some)
    /________\
   /          \  Unit Tests (Many)
  /____________\
```

---

## 2. Current Project Tests

### Project Test Structure

```
tests/
├── __init__.py              # Test package marker
├── test_debug.py            # Debug script for database operations
├── ui/                      # UI tests (Playwright)
│   ├── test_ui.py          # Basic UI element checks
│   ├── test_map_resize.py  # Map responsive testing
│   └── test_map_responsive.py
├── integration/             # Full system tests
│   └── test_full_system.py # End-to-end frontend + backend
├── fixtures/                # Shared test fixtures (to be created)
│   ├── race_fixtures.py
│   └── track_fixtures.py
└── README.md               # Test documentation
```

### Current Test Examples

**Debug Test Pattern** (`tests/test_debug.py`):
```python
"""
Test script for database data verification
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db.database import Database, TrackRepository
from src.core.auxiliary_calculator import AuxiliaryFieldCalculator

# Database connection
db = Database()
repo = TrackRepository(db)
calc = AuxiliaryFieldCalculator(db)

# Test track point retrieval
print("Retrieving track_id=1 points...")
points = repo.get_track_points(1)

print(f"Total {len(points)} points")
```

**What's Missing:**
- No pytest-based unit tests
- No API endpoint tests
- No fixture organization
- No test database isolation
- No coverage measurement

---

## 3. Pytest Fixture Organization

### Conftest.py Organization

**Root conftest.py** (`tests/conftest.py`):

```python
"""
Root test configuration with database fixtures
"""
import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.api.main import app
from src.db.database import Database

# Test database URL
TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost/test_track_filter"

# For async tests (if migrating to SQLAlchemy async)
# test_engine = create_async_engine(
#     TEST_DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://'),
#     echo=False,
#     future=True
# )

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_database():
    """
    Create test database once per test session.
    Uses existing database connection pattern.
    """
    db = Database(
        host="localhost",
        port=5432,
        dbname="test_track_filter",
        user="postgres",
        password="postgres"
    )

    # Create tables (assumes init.sql has been run)
    yield db

    # Cleanup after all tests
    db.close()

@pytest.fixture
def db_session(test_database):
    """
    Create new database connection for each test.
    Rolls back changes after test completes.
    """
    conn = test_database.get_connection()

    # Start transaction
    conn.execute("BEGIN")

    yield conn

    # Rollback transaction
    conn.execute("ROLLBACK")
    conn.close()

@pytest.fixture
def track_repo(db_session):
    """Create TrackRepository instance"""
    from src.db.database import TrackRepository
    db = Database()
    db.connection = db_session  # Inject test connection
    return TrackRepository(db)

@pytest.fixture
def sync_client():
    """Synchronous test client for API testing"""
    return TestClient(app)
```

### Domain-Specific Fixtures

**Race Fixtures** (`tests/fixtures/race_fixtures.py`):

```python
"""
Fixtures for race test data
"""
import pytest
from datetime import datetime, timedelta

@pytest.fixture
def sample_race(db_session):
    """Create sample race for testing"""
    query = """
    INSERT INTO races (
        name, start_time, end_time,
        start_point, end_point
    )
    VALUES (
        %s, %s, %s,
        ST_GeomFromText('POINT(121.5654 25.0330)', 4326),
        ST_GeomFromText('POINT(120.6736 24.1477)', 4326)
    )
    RETURNING id
    """

    cursor = db_session.cursor()
    cursor.execute(query, (
        "Test Race 2025",
        datetime.now(),
        datetime.now() + timedelta(hours=2)
    ))

    race_id = cursor.fetchone()[0]
    db_session.commit()

    return race_id

@pytest.fixture
def sample_tracks(db_session, sample_race):
    """Create sample tracks for testing"""
    query = """
    INSERT INTO tracks (race_id, pigeon_number, total_points)
    VALUES (%s, %s, %s)
    RETURNING id
    """

    track_ids = []
    cursor = db_session.cursor()

    for i in range(1, 6):
        cursor.execute(query, (
            sample_race,
            f"TW-2025-{i:03d}",
            500
        ))
        track_ids.append(cursor.fetchone()[0])

    db_session.commit()

    return track_ids

@pytest.fixture
def sample_track_points(db_session, sample_tracks):
    """Create sample track points"""
    query = """
    INSERT INTO track_points (
        track_id, timestamp, location,
        altitude, speed, wing_flaps_per_sec
    )
    VALUES (%s, %s, ST_GeomFromText(%s, 4326), %s, %s, %s)
    """

    cursor = db_session.cursor()

    for track_id in sample_tracks[:1]:  # First track only
        for i in range(10):
            cursor.execute(query, (
                track_id,
                datetime.now() + timedelta(seconds=i * 60),
                f"POINT({121.5 + i * 0.01} {25.0 + i * 0.01})",
                100.0 + i * 5,
                20.0 + i * 2,
                10.0
            ))

    db_session.commit()
```

**Expression Validator Fixtures** (`tests/fixtures/validator_fixtures.py`):

```python
"""
Fixtures for expression validation testing
"""
import pytest

@pytest.fixture
def allowed_fields():
    """Standard allowed fields for expression evaluation"""
    return [
        'altitude', 'speed', 'moving_speed', 'acceleration',
        'wing_flaps_per_sec', 'elevation_dem', 'altitude_agl',
        'on_highway', 'vibration_amplitude'
    ]

@pytest.fixture
def expression_validator(allowed_fields):
    """Create ExpressionValidator instance"""
    from src.core.expression_evaluator import ExpressionValidator
    return ExpressionValidator(allowed_fields=allowed_fields)

@pytest.fixture
def sample_point_data():
    """Sample track point data for expression evaluation"""
    return {
        'altitude': 150.0,
        'speed': 25.0,
        'moving_speed': 22.5,
        'acceleration': 0.5,
        'wing_flaps_per_sec': 10.0,
        'elevation_dem': 50.0,
        'altitude_agl': 100.0,
        'on_highway': False,
        'vibration_amplitude': 45.0
    }
```

### Fixture Scopes

**Scope Selection:**
- `function` (default): New instance per test function
- `class`: Shared across test class methods
- `module`: Shared across module
- `session`: Shared across entire test session

**Example:**
```python
@pytest.fixture(scope="session")
def database_schema():
    """Create schema once per session"""
    # Expensive setup
    pass

@pytest.fixture(scope="module")
def api_client():
    """Create client once per module"""
    pass

@pytest.fixture(scope="function")
def test_data():
    """Fresh data per test"""
    pass
```

---

## 4. Database Testing Strategies

### Test Database Setup

**Strategy 1: Separate Test Database (Recommended)**

```python
# tests/conftest.py
import pytest
import psycopg2

TEST_DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'dbname': 'test_track_filter',
    'user': 'postgres',
    'password': 'postgres'
}

@pytest.fixture(scope="session")
def test_db():
    """
    Create test database once per session.
    Drops and recreates before tests run.
    """
    # Connect to postgres database to create test database
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        dbname='postgres',
        user='postgres',
        password='postgres'
    )
    conn.autocommit = True
    cursor = conn.cursor()

    # Drop and recreate test database
    cursor.execute("DROP DATABASE IF EXISTS test_track_filter")
    cursor.execute("CREATE DATABASE test_track_filter")
    cursor.close()
    conn.close()

    # Connect to test database and create extensions
    test_conn = psycopg2.connect(**TEST_DB_CONFIG)
    test_cursor = test_conn.cursor()
    test_cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    test_conn.commit()

    # Run schema initialization
    with open('sql/init.sql', 'r') as f:
        test_cursor.execute(f.read())
    test_conn.commit()

    test_cursor.close()
    test_conn.close()

    yield TEST_DB_CONFIG

    # Cleanup after all tests
    conn = psycopg2.connect(
        host='localhost',
        dbname='postgres',
        user='postgres',
        password='postgres'
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("DROP DATABASE IF EXISTS test_track_filter")
    cursor.close()
    conn.close()
```

**Strategy 2: Transaction Rollback (Fast)**

```python
@pytest.fixture
def db_session(test_db):
    """
    Create new connection for each test.
    Automatically rolls back after test.
    """
    conn = psycopg2.connect(**test_db)

    # Start transaction
    cursor = conn.cursor()
    cursor.execute("BEGIN")

    yield conn

    # Rollback all changes
    conn.rollback()
    conn.close()
```

**Strategy 3: Testcontainers (Isolated)**

```python
import pytest
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def postgres_container():
    """
    Start PostgreSQL container for tests.
    Container is shared across all tests.
    """
    with PostgresContainer(
        "postgis/postgis:18-3.5",
        user="test",
        password="test",
        dbname="test_db"
    ) as postgres:
        # Wait for PostGIS to be ready
        conn = psycopg2.connect(postgres.get_connection_url())
        cursor = conn.cursor()
        cursor.execute("SELECT PostGIS_version()")
        version = cursor.fetchone()[0]
        print(f"PostGIS version: {version}")
        cursor.close()
        conn.close()

        yield postgres

@pytest.fixture
def db_session(postgres_container):
    """Create session using containerized database"""
    conn = psycopg2.connect(postgres_container.get_connection_url())
    yield conn
    conn.close()
```

### Test Data Preparation

**Factory Pattern:**

```python
# tests/factories/track_factory.py
from datetime import datetime, timedelta
from typing import Dict, List

class TrackFactory:
    """Factory for creating test track data"""

    @staticmethod
    def create_normal_track(
        db_conn,
        race_id: int,
        pigeon_number: str,
        num_points: int = 100
    ) -> int:
        """Create track with normal flight pattern"""
        cursor = db_conn.cursor()

        # Insert track
        cursor.execute(
            "INSERT INTO tracks (race_id, pigeon_number, total_points) "
            "VALUES (%s, %s, %s) RETURNING id",
            (race_id, pigeon_number, num_points)
        )
        track_id = cursor.fetchone()[0]

        # Insert points
        base_time = datetime.now()
        for i in range(num_points):
            cursor.execute(
                """
                INSERT INTO track_points (
                    track_id, timestamp, location,
                    altitude, speed, wing_flaps_per_sec
                )
                VALUES (%s, %s, ST_GeomFromText(%s, 4326), %s, %s, %s)
                """,
                (
                    track_id,
                    base_time + timedelta(seconds=i * 30),
                    f"POINT({121.5 + i * 0.001} {25.0 + i * 0.001})",
                    100.0 + (i % 50),  # Altitude variation
                    22.0 + (i % 5),    # Speed variation
                    10.0               # Normal flapping
                )
            )

        db_conn.commit()
        return track_id

    @staticmethod
    def create_cheating_track(
        db_conn,
        race_id: int,
        pigeon_number: str,
        cheating_segment: tuple = (50, 100)
    ) -> int:
        """Create track with cheating segment"""
        cursor = db_conn.cursor()

        # Insert track
        cursor.execute(
            "INSERT INTO tracks (race_id, pigeon_number, total_points) "
            "VALUES (%s, %s, %s) RETURNING id",
            (race_id, pigeon_number, 200)
        )
        track_id = cursor.fetchone()[0]

        base_time = datetime.now()
        cheat_start, cheat_end = cheating_segment

        for i in range(200):
            is_cheating = cheat_start <= i < cheat_end

            cursor.execute(
                """
                INSERT INTO track_points (
                    track_id, timestamp, location,
                    altitude, speed, wing_flaps_per_sec
                )
                VALUES (%s, %s, ST_GeomFromText(%s, 4326), %s, %s, %s)
                """,
                (
                    track_id,
                    base_time + timedelta(seconds=i * 30),
                    f"POINT({121.5 + i * 0.002} {25.0 + i * 0.001})",
                    20.0 if is_cheating else 100.0,   # Low altitude
                    30.0 if is_cheating else 22.0,    # High speed
                    2.0 if is_cheating else 10.0      # Low flapping
                )
            )

        db_conn.commit()
        return track_id
```

**Usage in Tests:**

```python
def test_filter_detects_cheating(db_session, sample_race):
    """Test that filter detects cheating patterns"""
    from tests.factories.track_factory import TrackFactory
    from src.core.filter_engine import FilterEngine

    # Create test data
    normal_track = TrackFactory.create_normal_track(
        db_session, sample_race, "TW-2025-001"
    )
    cheating_track = TrackFactory.create_cheating_track(
        db_session, sample_race, "TW-2025-002"
    )

    # Execute filter
    engine = FilterEngine(db_session)
    result = engine.execute({
        'race_id': sample_race,
        'conditions': [
            {'field': 'altitude', 'operator': '<', 'value': 30},
            {'field': 'speed', 'operator': '>', 'value': 25}
        ]
    })

    # Verify results
    assert cheating_track in result['suspicious_tracks']
    assert normal_track not in result['suspicious_tracks']
```

---

## 5. API Testing with TestClient

### Basic TestClient Usage

**Simple Endpoint Test:**

```python
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_list_races():
    """Test race listing endpoint"""
    response = client.get("/api/races")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
```

### Testing with Database Dependencies

**Override Dependencies:**

```python
import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.db.database import Database

@pytest.fixture
def client(db_session):
    """Test client with overridden database"""

    # Override dependency
    def override_get_db():
        return db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Clear overrides
    app.dependency_overrides.clear()

def test_create_race(client, db_session):
    """Test race creation endpoint"""
    response = client.post(
        "/api/races",
        json={
            "name": "Test Race",
            "start_time": "2025-01-01T10:00:00",
            "end_time": "2025-01-01T14:00:00",
            "start_lat": 25.0330,
            "start_lon": 121.5654,
            "end_lat": 24.1477,
            "end_lon": 120.6736
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Race"
    assert "id" in data
```

### Testing Filter Execution API

**Complete Filter Test:**

```python
def test_filter_execution_endpoint(client, sample_race, sample_tracks):
    """Test filter execution API endpoint"""

    # Step 1: Validate expression
    response = client.post(
        "/api/filter/validate-expression",
        json={
            "expression": "altitude - elevation_dem < 20",
            "allowed_fields": ["altitude", "elevation_dem"]
        }
    )

    assert response.status_code == 200
    assert response.json()["valid"] is True

    # Step 2: Execute filter
    response = client.post(
        "/api/filter/execute",
        json={
            "race_id": sample_race,
            "computed_fields": [
                {
                    "name": "altitude_agl",
                    "expression": "altitude - elevation_dem"
                }
            ],
            "conditions": [
                {
                    "field": "computed_altitude_agl",
                    "operator": "<",
                    "value": 20.0
                }
            ],
            "min_confidence": 0.7
        }
    )

    assert response.status_code == 200
    result = response.json()
    assert "result_id" in result
    assert "suspicious_count" in result

    # Step 3: Retrieve results
    result_id = result["result_id"]
    response = client.get(f"/api/filter/results/{result_id}")

    assert response.status_code == 200
    details = response.json()
    assert isinstance(details["suspicious_tracks"], list)
```

### Testing Error Cases

```python
def test_invalid_expression_rejected(client):
    """Test that invalid expressions are rejected"""
    response = client.post(
        "/api/filter/validate-expression",
        json={
            "expression": "DROP TABLE tracks",
            "allowed_fields": ["altitude"]
        }
    )

    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()

def test_missing_race_id(client):
    """Test filter execution with missing race"""
    response = client.post(
        "/api/filter/execute",
        json={
            "race_id": 999999,  # Non-existent
            "conditions": []
        }
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_malformed_request(client):
    """Test handling of malformed requests"""
    response = client.post(
        "/api/filter/execute",
        json={
            "race_id": "not_an_integer",
            "conditions": "not_a_list"
        }
    )

    assert response.status_code == 422  # Validation error
```

---

## 6. Parametrization Patterns

### Basic Parametrization

**Simple Value Testing:**

```python
import pytest

@pytest.mark.parametrize(
    "pigeon_number,expected_valid",
    [
        ("TW-2025-001", True),
        ("TW-2025-999", True),
        ("XX-2025-001", True),
        ("TW-25-001", False),      # Invalid year
        ("TW-2025-1", False),       # Invalid number format
        ("TW20250001", False),      # Missing dashes
        ("", False),                # Empty
        ("TW-2025-ABC", False),     # Non-numeric
    ]
)
def test_pigeon_number_validation(pigeon_number, expected_valid):
    """Test pigeon number format validation"""
    from src.validators import validate_pigeon_number

    if expected_valid:
        assert validate_pigeon_number(pigeon_number) == pigeon_number
    else:
        with pytest.raises(ValueError):
            validate_pigeon_number(pigeon_number)
```

### Advanced Parametrization with IDs

**Expression Security Testing:**

```python
@pytest.mark.parametrize(
    "expression,allowed_fields,should_pass",
    [
        ("altitude > 100", ["altitude"], True),
        ("altitude - elevation_dem < 20", ["altitude", "elevation_dem"], True),
        ("speed * 3.6 > 80", ["speed"], True),
        ("DROP TABLE tracks", ["altitude"], False),
        ("__import__('os').system('ls')", ["altitude"], False),
        ("altitude; DELETE FROM tracks", ["altitude"], False),
    ],
    ids=[
        "simple_comparison",
        "arithmetic_expression",
        "speed_conversion",
        "sql_injection_attempt",
        "code_execution_attempt",
        "statement_chaining"
    ]
)
def test_expression_validation(expression, allowed_fields, should_pass):
    """Test expression validator security"""
    from src.core.expression_evaluator import ExpressionValidator

    validator = ExpressionValidator(allowed_fields=allowed_fields)

    if should_pass:
        assert validator.validate(expression)
    else:
        assert not validator.validate(expression)
```

### Parametrizing Fixtures

**Filter Scenario Testing:**

```python
@pytest.fixture(params=[
    {"min_conf": 0.5, "expected_count": 3},
    {"min_conf": 0.7, "expected_count": 2},
    {"min_conf": 0.9, "expected_count": 1},
])
def filter_scenario(request):
    """Different filter confidence thresholds"""
    return request.param

def test_filter_confidence_threshold(
    client,
    sample_race,
    sample_tracks,
    filter_scenario
):
    """Test filter with different confidence thresholds"""
    response = client.post(
        "/api/filter/execute",
        json={
            "race_id": sample_race,
            "min_confidence": filter_scenario["min_conf"],
            "conditions": [
                {"field": "altitude", "operator": "<", "value": 30}
            ]
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["suspicious_tracks"]) == filter_scenario["expected_count"]
```

### Complex Test Matrices

**Boundary Testing:**

```python
@pytest.mark.parametrize("altitude", [0, 20, 50, 100, 500, 1000])
@pytest.mark.parametrize("speed", [0, 10, 20, 30, 50])
def test_auxiliary_calculator_combinations(altitude, speed):
    """Test auxiliary field calculation with various combinations"""
    from src.core.auxiliary_calculator import AuxiliaryFieldCalculator

    point = {
        'altitude': altitude,
        'speed': speed,
        'latitude': 25.0,
        'longitude': 121.5
    }

    calc = AuxiliaryFieldCalculator(None)
    result = calc._calculate_motion_features([point])

    # Verify calculations are within reasonable bounds
    assert result[0]['moving_speed'] >= 0
    assert result[0]['moving_speed'] <= speed * 1.1  # Allow 10% margin
```

---

## 7. Coverage Strategies

### Coverage Configuration

**pyproject.toml:**

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
addopts = [
    "--cov=src",
    "--cov-report=html",
    "--cov-report=term-missing",
    "--cov-branch",
    "--cov-fail-under=80",
]

[tool.coverage.run]
source = ["src"]
omit = [
    "*/tests/*",
    "*/venv/*",
    "*/__pycache__/*",
    "*/scripts/*",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
    "if sys.version_info",
]
```

### Running Coverage

```bash
# Run tests with coverage
pytest --cov=src --cov-report=html

# Generate detailed HTML report
pytest --cov=src --cov-report=html:htmlcov

# Open report
open htmlcov/index.html

# Check specific module coverage
pytest --cov=src.core.filter_engine --cov-report=term-missing

# Fail if coverage below threshold
pytest --cov=src --cov-fail-under=80
```

### Coverage Targets

**Module-Level Goals:**
- `src/api/`: 90%+ (API routes are critical)
- `src/core/`: 85%+ (Business logic)
- `src/db/`: 75%+ (Database layer, harder to test)
- Overall: 80%+

**What to Exclude:**
```python
# Exclude from coverage with pragma comment
def debug_only_function():
    # pragma: no cover
    print("Debug information")
```

### Edge Case Testing

```python
class TestFilterEngine:
    """Comprehensive filter engine tests"""

    @pytest.mark.parametrize("confidence", [0.0, 0.5, 1.0])
    def test_confidence_boundaries(self, confidence):
        """Test confidence score boundaries"""
        # Test exact boundaries
        pass

    @pytest.mark.parametrize("track_points", [0, 1, 100, 10000])
    def test_different_track_sizes(self, track_points):
        """Test with different track sizes"""
        # Test empty, single, normal, and large tracks
        pass

    def test_empty_conditions(self):
        """Test filter with no conditions"""
        # Should raise validation error or return all
        pass

    def test_malformed_expression(self):
        """Test with malformed expressions"""
        # Test syntax errors
        pass

    def test_database_connection_lost(self, db_session):
        """Test behavior when database connection is lost"""
        # Simulate connection failure
        db_session.close()
        with pytest.raises(Exception):
            # Attempt operation
            pass
```

---

## 8. PostGIS Testing

### Testing Spatial Queries

**Distance Calculation:**

```python
def test_postgis_distance_calculation(db_session):
    """Test PostGIS distance calculation between points"""
    cursor = db_session.cursor()

    # Create two points
    cursor.execute("""
        SELECT ST_Distance(
            ST_GeomFromText('POINT(121.5654 25.0330)', 4326)::geography,
            ST_GeomFromText('POINT(121.5664 25.0340)', 4326)::geography
        )
    """)

    distance = cursor.fetchone()[0]

    # Should be approximately 1.5 km
    assert 1400 < distance < 1600

def test_geography_vs_geometry(db_session):
    """Test difference between geography and geometry types"""
    cursor = db_session.cursor()

    # Same calculation with geography (accurate meters)
    cursor.execute("""
        SELECT ST_Distance(
            ST_GeomFromText('POINT(121.5654 25.0330)', 4326)::geography,
            ST_GeomFromText('POINT(121.6654 25.0330)', 4326)::geography
        )
    """)
    geo_distance = cursor.fetchone()[0]

    # Same calculation with geometry (degrees)
    cursor.execute("""
        SELECT ST_Distance(
            ST_GeomFromText('POINT(121.5654 25.0330)', 4326),
            ST_GeomFromText('POINT(121.6654 25.0330)', 4326)
        )
    """)
    geom_distance = cursor.fetchone()[0]

    # Geography should be ~111km (1 degree longitude at equator)
    assert 90000 < geo_distance < 130000

    # Geometry should be ~0.1 degrees
    assert 0.09 < geom_distance < 0.11
```

### Highway Proximity Testing

```python
def test_highway_proximity_detection(db_session):
    """Test detection of points near highways"""
    from tests.factories.track_factory import TrackFactory

    # Assuming highways table exists with test data
    cursor = db_session.cursor()

    # Insert test highway
    cursor.execute("""
        INSERT INTO highways (geom)
        VALUES (ST_GeomFromText('LINESTRING(121.5 25.0, 121.6 25.1)', 4326))
    """)

    # Create track point near highway
    cursor.execute("""
        INSERT INTO track_points (
            track_id, timestamp, location, altitude, speed
        )
        VALUES (
            1, NOW(),
            ST_GeomFromText('POINT(121.55 25.05)', 4326),
            100, 20
        )
        RETURNING id
    """)
    point_id = cursor.fetchone()[0]

    # Check proximity (within 100m)
    cursor.execute("""
        SELECT EXISTS(
            SELECT 1
            FROM track_points tp, highways h
            WHERE tp.id = %s
            AND ST_DWithin(tp.location::geography, h.geom::geography, 100)
        )
    """, (point_id,))

    near_highway = cursor.fetchone()[0]
    assert near_highway is True
```

### Elevation Testing

```python
def test_elevation_dem_calculation(db_session):
    """Test elevation DEM lookup"""
    cursor = db_session.cursor()

    # Mock elevation data (in real project, use actual DEM raster)
    cursor.execute("""
        SELECT 50.0 as elevation_dem
        -- In real implementation:
        -- SELECT ST_Value(rast, location) as elevation_dem
        -- FROM elevation_dem_table
        -- WHERE ST_Intersects(rast, location)
    """)

    elevation = cursor.fetchone()[0]

    assert elevation is not None
    assert 0 <= elevation <= 4000  # Taiwan max elevation ~4000m

def test_altitude_agl_computation(db_session):
    """Test altitude above ground level computation"""
    from src.core.auxiliary_calculator import AuxiliaryFieldCalculator

    point = {
        'altitude': 150.0,
        'elevation_dem': 50.0
    }

    # Manually compute AGL
    altitude_agl = point['altitude'] - point['elevation_dem']

    assert altitude_agl == 100.0
```

### Spatial Index Testing

```python
def test_gist_index_performance(db_session):
    """Test that GIST index improves query performance"""
    import time
    cursor = db_session.cursor()

    # Ensure index exists
    cursor.execute("""
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'track_points'
        AND indexname LIKE '%gist%'
    """)

    indexes = cursor.fetchall()
    assert len(indexes) > 0, "GIST index not found"

    # Query with spatial operation
    start = time.time()
    cursor.execute("""
        SELECT COUNT(*)
        FROM track_points
        WHERE ST_DWithin(
            location::geography,
            ST_GeomFromText('POINT(121.5654 25.0330)', 4326)::geography,
            1000
        )
    """)
    elapsed = time.time() - start

    # Should be fast with index
    assert elapsed < 1.0, f"Query too slow: {elapsed}s"
```

---

## 9. Project Testing Guide

### Adding Tests to Track Filter Project

**Step 1: Create Test Structure**

```bash
# Create test directories
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/fixtures
mkdir -p tests/factories

# Create conftest.py
touch tests/conftest.py

# Install pytest
pip install pytest pytest-cov pytest-mock
```

**Step 2: Write Unit Tests**

**Example: Test Expression Evaluator** (`tests/unit/test_expression_evaluator.py`):

```python
"""
Unit tests for expression evaluator
"""
import pytest
from src.core.expression_evaluator import ExpressionValidator, ExpressionEvaluator

class TestExpressionValidator:
    """Test ExpressionValidator"""

    def test_valid_simple_expression(self):
        """Test validation of simple expression"""
        validator = ExpressionValidator(['altitude'])
        assert validator.validate('altitude > 100')

    def test_invalid_field_rejected(self):
        """Test that invalid fields are rejected"""
        validator = ExpressionValidator(['altitude'])
        assert not validator.validate('DROP TABLE tracks')

    def test_code_injection_blocked(self):
        """Test that code injection attempts are blocked"""
        validator = ExpressionValidator(['altitude'])
        assert not validator.validate("__import__('os').system('ls')")

class TestExpressionEvaluator:
    """Test ExpressionEvaluator"""

    def test_evaluate_simple_expression(self):
        """Test evaluation of simple expression"""
        evaluator = ExpressionEvaluator(['altitude'])
        result = evaluator.evaluate('altitude > 100', {'altitude': 150})
        assert result is True

    def test_evaluate_arithmetic(self):
        """Test arithmetic expression evaluation"""
        evaluator = ExpressionEvaluator(['altitude', 'elevation_dem'])
        result = evaluator.evaluate(
            'altitude - elevation_dem',
            {'altitude': 150, 'elevation_dem': 50}
        )
        assert result == 100
```

**Step 3: Write Integration Tests**

**Example: Test Filter Engine** (`tests/integration/test_filter_engine.py`):

```python
"""
Integration tests for filter engine
"""
import pytest
from src.core.filter_engine import FilterEngine
from tests.factories.track_factory import TrackFactory

@pytest.mark.integration
class TestFilterEngineIntegration:
    """Integration tests for FilterEngine"""

    def test_filter_detects_cheating(self, db_session, sample_race):
        """Test that filter detects cheating patterns"""
        # Create test data
        normal_track = TrackFactory.create_normal_track(
            db_session, sample_race, "TW-2025-001"
        )
        cheating_track = TrackFactory.create_cheating_track(
            db_session, sample_race, "TW-2025-002"
        )

        # Execute filter
        engine = FilterEngine(db_session)
        result = engine.execute({
            'race_id': sample_race,
            'conditions': [
                {'field': 'altitude', 'operator': '<', 'value': 30},
                {'field': 'wing_flaps_per_sec', 'operator': '<', 'value': 5}
            ],
            'min_confidence': 0.7
        })

        # Verify
        assert cheating_track in result['suspicious_tracks']
        assert normal_track not in result['suspicious_tracks']
```

**Step 4: Run Tests**

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/unit/test_expression_evaluator.py

# Run with verbose output
pytest -v

# Run only integration tests
pytest -m integration
```

---

## 10. Common Pitfalls

### 1. Not Isolating Test Data

```python
# WRONG: Tests affect each other
def test_create_race():
    race = Race(id=1, name="Test")  # Hardcoded ID
    db.add(race)
    db.commit()

# CORRECT: Fresh data per test
@pytest.fixture
def race(db_session):
    race = Race(name=f"Test-{uuid.uuid4()}")
    db_session.add(race)
    db_session.commit()
    yield race
    db_session.delete(race)
```

### 2. Testing Implementation Instead of Behavior

```python
# WRONG: Testing internal implementation
def test_filter_engine():
    engine = FilterEngine()
    assert engine._internal_cache == {}  # Testing private state

# CORRECT: Testing public behavior
def test_filter_engine():
    engine = FilterEngine()
    result = engine.execute(rule)
    assert result.suspicious_count == 2  # Testing output
```

### 3. Not Using Async Tests for Async Code

```python
# WRONG: Sync test for async function
def test_get_track():
    track = get_track(1)  # This won't work!

# CORRECT: Async test for async function
@pytest.mark.asyncio
async def test_get_track():
    track = await get_track(1)
```

### 4. Over-Mocking

```python
# WRONG: Mock everything
@patch('src.db.connection')
@patch('src.models.track')
@patch('src.services.filter')
def test_something(mock_filter, mock_track, mock_conn):
    # Test becomes meaningless
    pass

# CORRECT: Use real database with test data
def test_something(db_session, sample_track):
    # Test real interactions
    result = filter_service.execute(sample_track)
```

### 5. Not Cleaning Up After Tests

```python
# WRONG: Leave test data
def test_create_track(db_session):
    track = Track(pigeon_number="TEST-001")
    db_session.add(track)
    db_session.commit()
    # Track stays in database!

# CORRECT: Rollback or explicit cleanup
@pytest.fixture
def db_session():
    session = TestSessionLocal()
    yield session
    session.rollback()  # Rollback after test
    session.close()
```

### 6. Slow Tests

```python
# WRONG: Create expensive data in every test
def test_filter():
    # Generate 10,000 points
    for i in range(10000):
        create_point()
    # Run test...

# CORRECT: Use fixtures with appropriate scope
@pytest.fixture(scope="module")
def large_dataset():
    # Created once per module
    return generate_large_dataset()
```

### 7. No Test Documentation

```python
# WRONG: Unclear test purpose
def test_filter():
    assert engine.run(data) == expected

# CORRECT: Document test purpose
def test_filter_rejects_low_altitude_high_speed():
    """
    Test that filter correctly identifies suspicious segments
    where altitude < 30m AND speed > 80 km/h, which indicates
    possible vehicle transport.
    """
    result = engine.execute(rule)
    assert result.suspicious_count == 1
```

---

## 11. Reference Links

### Official Documentation

- [pytest Official Docs](https://docs.pytest.org/)
- [pytest Fixtures](https://docs.pytest.org/en/stable/fixture.html)
- [pytest Parametrize](https://docs.pytest.org/en/stable/how-to/parametrize.html)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)

### Testing Best Practices

- [Testing FastAPI Application with Pytest](https://medium.com/@gnetkov/testing-fastapi-application-with-pytest-57080960fd62)
- [FastAPI Database Testing](https://www.getorchestra.io/guides/fastapi-database-testing-a-comprehensive-guide)
- [Pytest with Eric - API Testing](https://pytest-with-eric.com/api-testing/pytest-api-testing-2/)
- [Netflix Dispatch Testing Patterns](https://github.com/Netflix/dispatch)

### PostGIS Testing

- [PostGIS Documentation](https://postgis.net/documentation/)
- [Testing Spatial Data](https://postgis.net/workshops/postgis-intro/testing.html)
- [Testcontainers Python](https://testcontainers-python.readthedocs.io/)

### Project-Specific

- [Project Tests README](/tests/README.md)
- [CLAUDE.md - Testing Section](/CLAUDE.md#testing)
- [Track Filter Architecture](/CLAUDE.md#core-architecture)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Reference Complete