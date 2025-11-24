# FastAPI Teaching Guide

**Last Updated:** 2025-11-14
**Technology Version:** FastAPI 0.100+, Python 3.8+
**Reading Time:** 15-20 minutes

---

## Overview (5-min read)

**What is FastAPI?**

Modern Python web framework for building APIs with automatic OpenAPI documentation, type hints, and async support.

**When to use:**
- Building REST APIs with automatic validation
- Need interactive API docs (Swagger UI)
- Want type safety with Pydantic models
- Async/await patterns for high performance

**Core concepts:**
1. **APIRouter & Dependency Injection** - Organize routes, share logic
2. **Request/Response Models** - Pydantic for automatic validation
3. **Error Handling** - HTTPException with correct status codes

**Quick Example:**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items/")
async def create_item(item: Item):
    if item.price < 0:
        raise HTTPException(status_code=400, detail="Invalid price")
    return {"item": item}
```

---

## Deep Dive (15-min read)

### Concept 1: APIRouter and Dependency Injection

**Problem it solves:** All endpoints in one file, repeated logic (auth, DB).

**Code Example:**

```python
# ❌ BEFORE (repeated DB logic)
@app.get("/users/{user_id}")
def get_user(user_id: int):
    db = get_database_connection()  # Repeated
    return db.query_user(user_id)
```

```python
# ✅ AFTER (router + dependency injection)
# api/routes/users.py
from fastapi import APIRouter, Depends
from ..dependencies import get_db

router = APIRouter(prefix="/users")

@router.get("/{user_id}")
async def get_user(user_id: int, db = Depends(get_db)):
    return db.query_user(user_id)

# api/dependencies.py
def get_db():
    db = Database()
    try:
        yield db  # Ensures cleanup
    finally:
        db.close()

# main.py
app = FastAPI()
app.include_router(router)
```

**When to use:**
- Multiple endpoints with shared logic
- Need to organize routes by domain
- Want testable, reusable components

**Common mistakes:**
- ❌ Not using `yield` in dependency → Resources leak → ✅ Use `yield` to ensure cleanup
- ❌ Creating new dependency instances → Slow → ✅ Use dependency caching with `Depends`

---

### Concept 2: Request/Response Models (Pydantic)

**Problem it solves:** Manual validation is error-prone and verbose.

**Code Example:**

```python
# ❌ BEFORE (manual validation)
@app.post("/items/")
def create_item(request: dict):
    if "name" not in request or request["price"] < 0:
        raise HTTPException(400, "Invalid input")
    return request
```

```python
# ✅ AFTER (Pydantic models)
from pydantic import BaseModel, Field

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)

class ItemResponse(BaseModel):
    id: int
    name: str
    price: float

@app.post("/items/", response_model=ItemResponse)
async def create_item(item: ItemCreate):
    return {"id": 1, "name": item.name, "price": item.price}
```

**When to use:**
- All API endpoints (request and response)
- Complex validation rules
- Need API documentation

**Common mistakes:**
- ❌ Using `dict` instead of Pydantic models → No validation → ✅ Always use BaseModel
- ❌ Not using `response_model` → Returns extra fields → ✅ Specify response_model

---

### Concept 3: Error Handling

**Problem it solves:** Generic errors return 500, confusing users.

**Code Example:**

```python
# ❌ BEFORE (generic error returns 500)
@app.get("/items/{item_id}")
def get_item(item_id: int):
    item = db.get(item_id)
    if not item:
        raise Exception("Not found")  # Returns 500!
    return item
```

```python
# ✅ AFTER (structured errors with correct status)
from fastapi import HTTPException, status

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    item = db.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )
    return item
```

**When to use:**
- Resource not found → 404
- Invalid input → 400
- Unauthorized → 401
- Forbidden → 403
- Server error → 500

**Common mistakes:**
- ❌ Using generic `Exception` → Returns 500 → ✅ Use HTTPException with correct status
- ❌ Not providing error details → ✅ Include helpful error message

---

## Best Practices Checklist

- [ ] **Use APIRouter for organization** - Group related endpoints
- [ ] **Use Pydantic models for all requests/responses** - Ensures validation and docs
- [ ] **Use Depends() for shared logic** - Avoid code duplication
- [ ] **Use async def for I/O operations** - Better performance with async/await
- [ ] **Use HTTPException with correct status codes** - Clear error communication

---

## Troubleshooting

**Issue: "Field required" validation error (422)**
- Cause: Missing required field or wrong type
- Fix: Make field optional: `name: Optional[str] = None`

**Issue: New DB connection per request**
- Cause: Dependency not using `yield`
- Fix: Use `yield db` pattern for cleanup

---

## Further Learning

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- Related: `teaching-pydantic.md`, `teaching-testing.md`

---

**Last Updated:** 2025-11-14
**Maintainer:** Teaching System
