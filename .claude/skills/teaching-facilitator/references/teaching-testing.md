# Testing Teaching Guide

**Last Updated:** 2025-11-14
**Technology Version:** pytest 7.x+, FastAPI 0.100+
**Reading Time:** 15-20 minutes

---

## Overview (5-min read)

**What is Testing?**

Automated verification that code works as expected. Catch bugs before production, enable refactoring confidence.

**When to use:**
- Writing new features (TDD: test first, code second)
- Refactoring existing code (regression prevention)
- API endpoints (request/response validation)
- Critical business logic (accuracy verification)

**Core concepts:**
1. **pytest Basics** - Test structure, fixtures, assertions, marks
2. **FastAPI TestClient** - Test API endpoints without running server
3. **Mocking & Patching** - Isolate tests by faking dependencies

**Quick Example:**

```python
# test_api.py
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_create_item():
    response = client.post("/items/", json={"name": "Widget", "price": 9.99})
    assert response.status_code == 200
    assert response.json()["name"] == "Widget"
```

**Decision Tree:**
- Testing API endpoints? → Use TestClient
- Need shared setup (DB connection)? → Use fixtures
- Need to fake external APIs? → Use mocking/patching
- Running specific tests? → Use pytest marks (@pytest.mark.slow)

---

## Deep Dive (15-min read)

### Concept 1: pytest Basics (Fixtures, Assertions, Marks)

**Problem it solves:**
Tests need shared setup (database, config). Fixtures provide reusable test dependencies.

**Code Example:**

```python
# ❌ BEFORE: Repeated setup in every test
def test_user_creation():
    db = Database()  # Repeated
    db.connect()
    user = db.create_user("Alice")
    assert user.name == "Alice"
    db.close()

def test_user_query():
    db = Database()  # Repeated again!
    db.connect()
    users = db.get_users()
    assert len(users) >= 0
    db.close()

# ✅ AFTER: Fixture provides shared setup
import pytest

@pytest.fixture
def db():
    database = Database()
    database.connect()
    yield database  # Provide to tests
    database.close()  # Cleanup after test

def test_user_creation(db):
    user = db.create_user("Alice")
    assert user.name == "Alice"

def test_user_query(db):
    users = db.get_users()
    assert len(users) >= 0

# Why this is better:
# - No repeated setup/teardown code
# - Automatic cleanup (even if test fails)
# - Reusable across tests
```

**Pytest Marks for Organization:**

```python
# Mark slow tests to skip during quick runs
@pytest.mark.slow
def test_large_dataset_processing():
    # Takes 5+ seconds
    pass

# Run: pytest -m "not slow"  (skips slow tests)

# Mark integration tests
@pytest.mark.integration
def test_api_with_real_database():
    pass

# Run: pytest -m integration
```

**Common mistakes:**
- ❌ Not using fixtures → Code duplication
- ❌ Forgetting teardown → Resource leaks
- ✅ Use fixtures with yield for setup/teardown

---

### Concept 2: FastAPI TestClient

**Problem it solves:**
Testing API endpoints without running a server. Fast, reliable, no network issues.

**Code Example:**

```python
# ❌ BEFORE: Manual HTTP requests (requires running server)
import requests
response = requests.post("http://localhost:8000/items/", json={"name": "Widget"})
# Problem: Server must be running, port conflicts, slow

# ✅ AFTER: TestClient (no server needed)
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_create_item():
    response = client.post("/items/", json={"name": "Widget", "price": 9.99})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Widget"
    assert data["price"] == 9.99

def test_create_item_invalid_price():
    response = client.post("/items/", json={"name": "Widget", "price": -1})
    assert response.status_code == 400  # Validation error
    assert "price" in response.json()["detail"]

# Why this is better:
# - No server required (runs in-memory)
# - Fast (no network overhead)
# - Reliable (no port conflicts)
```

**Testing with Dependency Overrides:**

```python
# Override database dependency for testing
from src.api.dependencies import get_db

def get_test_db():
    return MockDatabase()  # Use mock instead of real DB

app.dependency_overrides[get_db] = get_test_db

def test_endpoint_with_mock_db():
    response = client.get("/items/")
    assert response.status_code == 200
```

**Common mistakes:**
- ❌ Running real server for tests → Slow, flaky
- ❌ Using real database → Tests affect each other
- ✅ Use TestClient + dependency overrides

---

### Concept 3: Mocking & Patching

**Problem it solves:**
Isolate tests by faking external dependencies (APIs, databases, file system).

**Code Example:**

```python
# ❌ BEFORE: Test depends on external API (slow, unreliable)
def fetch_weather(city: str):
    response = requests.get(f"https://api.weather.com/{city}")
    return response.json()

def test_fetch_weather():
    data = fetch_weather("Tokyo")  # Real API call!
    assert "temperature" in data

# ✅ AFTER: Mock the external API
from unittest.mock import patch, MagicMock

def test_fetch_weather_mocked():
    mock_response = MagicMock()
    mock_response.json.return_value = {"temperature": 25}
    
    with patch('requests.get', return_value=mock_response):
        data = fetch_weather("Tokyo")
        assert data["temperature"] == 25

# Why this is better:
# - No real API calls (fast, reliable)
# - Test edge cases (API down, invalid response)
# - No API rate limits
```

**Patching Database Calls:**

```python
# src/api/routes.py
def get_item(item_id: int, db = Depends(get_db)):
    return db.query(f"SELECT * FROM items WHERE id={item_id}")

# test_routes.py
@patch('src.api.routes.get_db')
def test_get_item(mock_get_db):
    mock_db = MagicMock()
    mock_db.query.return_value = {"id": 1, "name": "Widget"}
    mock_get_db.return_value = mock_db
    
    response = client.get("/items/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Widget"
```

**Common mistakes:**
- ❌ Mocking too much → Tests don't reflect reality
- ❌ Not mocking external APIs → Slow, flaky tests
- ✅ Mock external dependencies, test your logic

---

## Best Practices Checklist

- [ ] **Use fixtures for shared setup** - Avoid code duplication
- [ ] **Use TestClient for API tests** - No server required
- [ ] **Mock external dependencies** - Fast, reliable tests
- [ ] **Use pytest marks for organization** - Run subsets of tests (@pytest.mark.slow)
- [ ] **Test edge cases and errors** - Not just happy path

---

## Troubleshooting

### Issue 1: Fixture Not Found

**Symptoms:**
```
fixture 'db' not found
```

**Cause:** Fixture defined in wrong file or not imported

**Solution:**
```python
# Put shared fixtures in conftest.py (auto-discovered)
# conftest.py
import pytest

@pytest.fixture
def db():
    return Database()

# test_users.py (automatically finds db fixture)
def test_user(db):
    assert db is not None
```

---

### Issue 2: Tests Pass Individually, Fail Together

**Symptoms:** `pytest test_a.py` passes, `pytest` fails

**Cause:** Tests sharing state (database, global variables)

**Solution:**
```python
# Use fixture scope to isolate tests
@pytest.fixture(scope="function")  # New instance per test
def db():
    database = Database()
    yield database
    database.clear()  # Clean state after each test
```

---

### Issue 3: TestClient Returns 500 for Validation Errors

**Symptoms:** Expected 400/422, got 500 Internal Server Error

**Cause:** Exception not caught in endpoint

**Solution:**
```python
# Ensure HTTPException is raised, not generic Exception
from fastapi import HTTPException

@app.post("/items/")
def create_item(item: ItemCreate):
    if item.price < 0:
        raise HTTPException(400, "Invalid price")  # ✅ Correct
    # Don't use: raise ValueError("Invalid price")  # ❌ Returns 500
```

---

## Further Learning

**Official Documentation:**
- [pytest Docs](https://docs.pytest.org/)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/)

**Related Topics:**
- FastAPI patterns - See `teaching-fastapi.md`
- Pydantic validation - See `teaching-pydantic.md`

---

**Last Updated:** 2025-11-14
**Maintainer:** Teaching System
