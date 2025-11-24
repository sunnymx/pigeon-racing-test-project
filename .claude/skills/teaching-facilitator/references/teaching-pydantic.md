# Pydantic Teaching Guide

**Last Updated:** 2025-11-14
**Technology Version:** Pydantic v2.0+, Python 3.8+
**Reading Time:** 15-20 minutes

---

## Overview (5-min read)

**What is Pydantic?**

Data validation library using Python type hints. Auto-validates, parses, and serializes data with rich error messages.

**When to use:**
- Validating API request/response data (FastAPI, Django)
- Parsing configuration files (JSON, YAML, env vars)
- Data transformation with type safety
- Settings management (environment variables)

**Core concepts:**
1. **BaseModel Basics** - Define data structures with automatic validation
2. **Field Validation** - Custom rules using Field() and validators
3. **model_validator** - Complex multi-field validation (Pydantic v2 syntax)
4. **Config & Aliases** - Control serialization, field names

**Quick Example:**

```python
from pydantic import BaseModel, Field

class User(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    email: str
    age: int = Field(..., ge=0, le=150)

# Auto-validates
user = User(name="Alice", email="alice@example.com", age=30)  # ✓
user = User(name="", email="bad", age=200)  # ✗ ValidationError
```

**Decision Tree:**
- Simple type validation? → Use type hints only
- Range/length constraints? → Use Field()
- Custom validation logic? → Use @field_validator
- Multi-field dependencies? → Use @model_validator

---

## Deep Dive (15-min read)

### Concept 1: BaseModel Basics

**Problem it solves:**
Manual validation is verbose and error-prone. Pydantic auto-validates from type hints.

**Code Example:**

```python
# ❌ BEFORE: Manual validation
def create_user(data: dict):
    if "name" not in data or not isinstance(data["name"], str):
        raise ValueError("Invalid name")
    if "age" not in data or data["age"] < 0:
        raise ValueError("Invalid age")
    return data

# ✅ AFTER: Pydantic BaseModel
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

# Automatically validates and converts types
user = User(name="Alice", age="30")  # age: "30" → 30 (auto-converted)
print(user.name)  # Alice
print(user.model_dump())  # {"name": "Alice", "age": 30}

# Why this is better:
# - Type conversion (str "30" → int 30)
# - Rich error messages with field names
# - Serialization (model_dump, model_dump_json)
```

**When to use:**
- Every data structure that needs validation
- API request/response bodies
- Config file parsing

**Common mistakes:**
- ❌ Using dict instead of BaseModel → No validation
- ❌ Not using Optional for nullable fields → ValidationError
- ✅ Use `Optional[str] = None` for optional fields

---

### Concept 2: Field Validation with Field() and @field_validator

**Problem it solves:**
Type hints alone can't enforce ranges, patterns, or custom rules.

**Code Example:**

```python
# ❌ BEFORE: Type hints only (no range check)
class User(BaseModel):
    age: int  # Allows negative ages!

# ✅ AFTER: Field() with constraints
from pydantic import BaseModel, Field, field_validator

class User(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    age: int = Field(..., ge=0, le=150)  # 0 <= age <= 150

    @field_validator('name')
    @classmethod
    def name_must_not_contain_numbers(cls, v: str) -> str:
        if any(char.isdigit() for char in v):
            raise ValueError('Name must not contain numbers')
        return v.strip()  # Clean whitespace

# Test
user = User(name=" Alice ", email="alice@example.com", age=30)  # ✓
user = User(name="Alice123", email="bad", age=-5)  # ✗ Multiple errors

# Why this is better:
# - Declarative constraints (min_length, pattern, ge/le)
# - Custom validation logic (@field_validator)
# - Automatic error aggregation
```

**When to use:**
- Simple constraints (range, length, pattern) → Use Field()
- Complex logic (cross-field checks) → Use @field_validator

**Common mistakes:**
- ❌ Using validator instead of field_validator → Old Pydantic v1 syntax
- ✅ Use @field_validator (Pydantic v2)

---

### Concept 3: model_validator for Multi-Field Validation

**Problem it solves:**
Some validation requires checking multiple fields together (e.g., end_date > start_date).

**Code Example:**

```python
# ❌ BEFORE: Can't check field dependencies
class Event(BaseModel):
    start_date: datetime
    end_date: datetime
    # No way to enforce end_date > start_date

# ✅ AFTER: model_validator
from pydantic import BaseModel, model_validator
from datetime import datetime

class Event(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime

    @model_validator(mode='after')
    def check_dates(self) -> 'Event':
        if self.end_date <= self.start_date:
            raise ValueError('end_date must be after start_date')
        return self

# Test
event = Event(
    name="Conference",
    start_date=datetime(2025, 1, 1),
    end_date=datetime(2025, 1, 2)
)  # ✓

event = Event(
    name="Conference",
    start_date=datetime(2025, 1, 2),
    end_date=datetime(2025, 1, 1)
)  # ✗ ValidationError: end_date must be after start_date

# Why this is better:
# - Enforces business logic (date ordering)
# - Runs after field validation
# - Clear error messages
```

**When to use:**
- Checking field dependencies (date ranges, conditional requirements)
- Complex business rules spanning multiple fields

**Common mistakes:**
- ❌ Using @validator(mode='before') → Gets raw data, not parsed
- ✅ Use @model_validator(mode='after') for validated data

---

## Best Practices Checklist

- [ ] **Use BaseModel for all data structures** - Auto-validation and serialization
- [ ] **Use Field() for constraints** - min/max length, ranges, patterns
- [ ] **Use Optional[T] for nullable fields** - Avoid "field required" errors
- [ ] **Use @field_validator for single-field logic** - Custom validation rules
- [ ] **Use @model_validator for multi-field checks** - Cross-field dependencies

---

## Troubleshooting

### Issue 1: "field required" Error on Optional Fields

**Symptoms:**
```python
ValidationError: 1 validation error for User
description
  field required (type=value_error.missing)
```

**Cause:** Field defined without default value or Optional

**Solution:**
```python
from typing import Optional

class User(BaseModel):
    name: str
    description: Optional[str] = None  # ✅ Optional with default
```

---

### Issue 2: "@validator is deprecated" Warning

**Symptoms:** Pydantic v2 warns about deprecated @validator

**Cause:** Using old Pydantic v1 syntax

**Solution:**
```python
# ❌ OLD (Pydantic v1)
from pydantic import validator
@validator('name')
def check_name(cls, v):
    return v

# ✅ NEW (Pydantic v2)
from pydantic import field_validator
@field_validator('name')
@classmethod
def check_name(cls, v: str) -> str:
    return v
```

---

### Issue 3: Validation Not Running

**Symptoms:** Invalid data passes without ValidationError

**Cause:** Using dict instead of BaseModel instance

**Solution:**
```python
# ❌ WRONG: Direct dict usage
data = {"name": "Alice", "age": -5}
# No validation happens!

# ✅ CORRECT: Create BaseModel instance
user = User(**data)  # ValidationError raised
```

---

## Further Learning

**Official Documentation:**
- [Pydantic v2 Docs](https://docs.pydantic.dev/latest/)
- [Migration Guide v1 → v2](https://docs.pydantic.dev/latest/migration/)

**Related Topics:**
- FastAPI integration - See `teaching-fastapi.md`
- Settings management - See Pydantic Settings docs

---

**Last Updated:** 2025-11-14
**Maintainer:** Teaching System
