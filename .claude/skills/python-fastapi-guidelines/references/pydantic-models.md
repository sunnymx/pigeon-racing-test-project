# Pydantic Models and Validation

## Table of Contents

1. [Overview](#1-overview)
2. [Pydantic v1 to v2 Migration Guide](#2-pydantic-v1-to-v2-migration-guide)
3. [Request/Response Model Patterns](#3-requestresponse-model-patterns)
4. [Field Validation](#4-field-validation)
5. [Custom Validators (Pydantic v2)](#5-custom-validators-pydantic-v2)
6. [Serialization Customization](#6-serialization-customization)
7. [Config Options (ConfigDict)](#7-config-options-configdict)
8. [Project Integration](#8-project-integration)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Reference Links](#10-reference-links)

---

## 1. Overview

### Why Pydantic is Critical in FastAPI

Pydantic v2 is the backbone of FastAPI's request validation and response serialization. It provides:

- **Type Safety**: Runtime validation of data types
- **Data Validation**: Rich validation rules with clear error messages
- **Serialization**: Automatic conversion between Python objects and JSON
- **Documentation**: Auto-generated OpenAPI schemas
- **Performance**: Significant speed improvements in v2 (up to 17x faster)

### Key Pydantic v2 Features

1. **@field_validator**: Validate individual fields with custom logic
2. **@model_validator**: Cross-field validation and data transformation
3. **ConfigDict**: Configuration via dictionary (replaces Config class)
4. **model_dump()**: Serialize to dictionary (replaces .dict())
5. **Field()**: Rich field metadata and validation constraints
6. **Computed fields**: Dynamically calculated fields in responses

### Version Compatibility

This guide focuses on **Pydantic v2** (2.0+), which introduced breaking changes from v1. For migration instructions, see Section 2.

**Minimum versions for this project:**
- Python: 3.8+
- Pydantic: 2.5.3+
- FastAPI: 0.109.0+

---

## 2. Pydantic v1 to v2 Migration Guide

### Major Changes Summary

| Feature | Pydantic v1 | Pydantic v2 |
|---------|-------------|-------------|
| ORM Mode | `class Config: orm_mode = True` | `model_config = ConfigDict(from_attributes=True)` |
| Field Names | `allow_population_by_field_name` | `populate_by_name` |
| Serialization | `.dict()` | `.model_dump()` |
| JSON Serialization | `.json()` | `.model_dump_json()` |
| Validators | `@validator()` | `@field_validator()` or `@model_validator()` |
| Root Validators | `@root_validator()` | `@model_validator()` |
| Schema Example | `class Config: schema_extra` | `model_config = ConfigDict(json_schema_extra=...)` |

### Migration Example

**Pydantic v1 (Deprecated):**

```python
from pydantic import BaseModel, validator

class Track(BaseModel):
    pigeon_number: str
    total_points: int

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "pigeon_number": "TW-2025-001",
                "total_points": 500
            }
        }

    @validator('total_points')
    def validate_points(cls, v):
        if v <= 0:
            raise ValueError('Must be positive')
        return v

    def dict(self):
        return super().dict()
```

**Pydantic v2 (Current):**

```python
from pydantic import BaseModel, Field, field_validator, ConfigDict

class Track(BaseModel):
    pigeon_number: str
    total_points: int

    model_config = ConfigDict(
        from_attributes=True,  # Replaces orm_mode
        populate_by_name=True,  # Replaces allow_population_by_field_name
        json_schema_extra={
            "example": {
                "pigeon_number": "TW-2025-001",
                "total_points": 500
            }
        }
    )

    @field_validator('total_points')
    @classmethod
    def validate_points(cls, v: int) -> int:
        if v <= 0:
            raise ValueError('Must be positive')
        return v

    def to_dict(self):
        return self.model_dump()  # Replaces .dict()
```

### Migration Checklist

- [ ] Replace `class Config` with `model_config = ConfigDict(...)`
- [ ] Change `orm_mode=True` to `from_attributes=True`
- [ ] Replace `@validator()` with `@field_validator()`
- [ ] Replace `@root_validator()` with `@model_validator()`
- [ ] Update `.dict()` calls to `.model_dump()`
- [ ] Update `.json()` calls to `.model_dump_json()`
- [ ] Add `@classmethod` decorator to all validators
- [ ] Add type hints to validator methods

---

## 3. Request/Response Model Patterns

### Model Hierarchy Strategy

Use separate models for different contexts to maintain clean boundaries:

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

# Base model with shared fields
class TrackBase(BaseModel):
    """Shared fields across all track models"""
    pigeon_number: str = Field(..., min_length=1, max_length=50)
    total_points: int = Field(..., gt=0)

# Request model (create)
class TrackCreate(TrackBase):
    """Fields required when creating a new track"""
    race_id: int = Field(..., gt=0)
    gpx_data: str = Field(..., description="GPX XML data")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pigeon_number": "TW-2025-001",
                "total_points": 500,
                "race_id": 1,
                "gpx_data": "<?xml version='1.0'?>..."
            }
        }
    )

# Update model (all fields optional)
class TrackUpdate(BaseModel):
    """Fields that can be updated (all optional)"""
    pigeon_number: Optional[str] = Field(None, min_length=1, max_length=50)
    total_points: Optional[int] = Field(None, gt=0)

# Response model (includes computed fields)
class TrackResponse(TrackBase):
    """Fields returned to API clients"""
    id: int
    race_id: int
    created_at: datetime
    suspicious_segments: int = Field(..., description="Number of flagged segments")

    model_config = ConfigDict(from_attributes=True)  # Enables ORM mode

# Internal model (with sensitive data)
class TrackInternal(TrackResponse):
    """Fields used only in internal processing"""
    processing_metadata: dict
    raw_gpx_hash: str
```

### Why Separate Models?

1. **Security**: Response models don't expose internal fields (e.g., password hashes)
2. **Flexibility**: Update models have optional fields, create models require all fields
3. **Documentation**: Clear API contract for each endpoint
4. **Validation**: Different rules for different contexts

### Usage in FastAPI Routes

```python
from fastapi import APIRouter, HTTPException, Depends

router = APIRouter(prefix="/tracks", tags=["tracks"])

@router.post("/", response_model=TrackResponse, status_code=201)
async def create_track(
    track: TrackCreate,
    track_repo = Depends(get_track_repo)
):
    """Create a new track (requires all fields)"""
    new_track = await track_repo.create(track)
    return new_track

@router.patch("/{track_id}", response_model=TrackResponse)
async def update_track(
    track_id: int,
    track: TrackUpdate,
    track_repo = Depends(get_track_repo)
):
    """Update track (only provided fields)"""
    updated_track = await track_repo.update(track_id, track)
    if not updated_track:
        raise HTTPException(404, "Track not found")
    return updated_track

@router.get("/{track_id}", response_model=TrackResponse)
async def get_track(
    track_id: int,
    track_repo = Depends(get_track_repo)
):
    """Get track details (excludes internal fields)"""
    track = await track_repo.get(track_id)
    if not track:
        raise HTTPException(404, "Track not found")
    return track
```

---

## 4. Field Validation

### Basic Field Constraints

Pydantic's `Field()` provides rich built-in validation:

```python
from pydantic import BaseModel, Field
from typing import Annotated

class FilterRule(BaseModel):
    # String constraints
    name: str = Field(
        ...,  # Required field
        min_length=3,
        max_length=100,
        description="Human-readable filter name",
        examples=["Low Altitude Detection"]
    )

    # Numeric constraints
    min_confidence: float = Field(0.7, ge=0.0, le=1.0)  # 0.0 <= x <= 1.0
    max_confidence: float = Field(1.0, ge=0.0, le=1.0)

    # Pattern validation
    expression: str = Field(
        ...,
        max_length=500,
        pattern=r"^[a-zA-Z0-9_\s\(\)\+\-\*\/\<\>\=\&\|\!\.]+$"
    )

    # Integer constraints
    priority: int = Field(1, gt=0, lt=100)  # 0 < x < 100

    # List constraints
    tags: list[str] = Field(default_factory=list, max_length=10)
```

### Common Field Constraints

| Constraint | Type | Description | Example |
|------------|------|-------------|---------|
| `min_length` | str, list | Minimum length | `Field(min_length=3)` |
| `max_length` | str, list | Maximum length | `Field(max_length=100)` |
| `pattern` | str | Regex pattern | `Field(pattern=r"^\w+$")` |
| `ge` | numeric | Greater than or equal | `Field(ge=0.0)` |
| `gt` | numeric | Greater than | `Field(gt=0)` |
| `le` | numeric | Less than or equal | `Field(le=1.0)` |
| `lt` | numeric | Less than | `Field(lt=100)` |
| `...` | any | Required field | `Field(...)` |
| `default` | any | Default value | `Field(default=0)` |
| `default_factory` | any | Factory function | `Field(default_factory=list)` |

### Annotated Types for Reusability

Create reusable type aliases with built-in validation:

```python
from typing import Annotated
from pydantic import Field

# Define reusable types
Latitude = Annotated[float, Field(ge=-90.0, le=90.0)]
Longitude = Annotated[float, Field(ge=-180.0, le=180.0)]
Altitude = Annotated[float, Field(ge=0.0, le=10000.0)]
Confidence = Annotated[float, Field(ge=0.0, le=1.0)]

class TrackPoint(BaseModel):
    latitude: Latitude
    longitude: Longitude
    altitude: Altitude
    confidence: Confidence
```

---

## 5. Custom Validators (Pydantic v2)

### @field_validator Decorator

Validate individual fields with custom logic:

```python
from pydantic import BaseModel, field_validator
import re

class TrackPoint(BaseModel):
    latitude: float
    longitude: float
    altitude: float

    @field_validator('latitude')
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        """Validate latitude is in valid range"""
        if not -90 <= v <= 90:
            raise ValueError(f'Latitude must be between -90 and 90, got {v}')
        return v

    @field_validator('longitude')
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        """Validate longitude is in valid range"""
        if not -180 <= v <= 180:
            raise ValueError(f'Longitude must be between -180 and 180, got {v}')
        return v

    @field_validator('altitude', mode='after')
    @classmethod
    def round_altitude(cls, v: float) -> float:
        """Round altitude to 2 decimal places"""
        return round(v, 2)
```

### Field Validator with Context Access

Access other fields using `ValidationInfo`:

```python
from pydantic import BaseModel, ValidationInfo, field_validator, Field

class FilterRule(BaseModel):
    min_confidence: float = Field(0.0, ge=0.0, le=1.0)
    max_confidence: float = Field(1.0, ge=0.0, le=1.0)

    @field_validator('max_confidence')
    @classmethod
    def validate_confidence_range(cls, v: float, info: ValidationInfo) -> float:
        """Ensure max_confidence >= min_confidence"""
        min_conf = info.data.get('min_confidence', 0.0)
        if v < min_conf:
            raise ValueError(
                f'max_confidence ({v}) must be >= min_confidence ({min_conf})'
            )
        return v
```

### Field Validator Mode: 'before' vs 'after'

Field validators run in two modes:

**mode='before'**: Runs before Pydantic type parsing (gets raw input)

```python
from datetime import datetime

class Event(BaseModel):
    timestamp: datetime

    @field_validator('timestamp', mode='before')
    @classmethod
    def parse_timestamp(cls, v):
        """Convert string/int to datetime"""
        # v could be string, int, or datetime
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        elif isinstance(v, int):
            return datetime.fromtimestamp(v)
        return v
```

**mode='after'**: Runs after Pydantic type parsing (gets typed value)

```python
class Event(BaseModel):
    timestamp: datetime

    @field_validator('timestamp', mode='after')
    @classmethod
    def validate_timestamp(cls, v: datetime) -> datetime:
        """Validate datetime is not in the future"""
        # v is already a datetime object
        if v > datetime.now():
            raise ValueError("Timestamp cannot be in the future")
        return v
```

### Multiple Field Validators

Validate multiple fields with one validator:

```python
class TrackPoint(BaseModel):
    altitude: float
    elevation_dem: float
    vibration_amplitude: float

    @field_validator('altitude', 'elevation_dem', 'vibration_amplitude')
    @classmethod
    def round_to_two_decimals(cls, v: float) -> float:
        """Round all float fields to 2 decimal places"""
        return round(v, 2)
```

### @model_validator Decorator

Cross-field validation after all fields are parsed:

```python
from pydantic import BaseModel, model_validator
from typing_extensions import Self
from datetime import datetime

class Race(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float

    @model_validator(mode='after')
    def validate_race_data(self) -> Self:
        """Validate cross-field constraints"""

        # Time validation
        if self.end_time <= self.start_time:
            raise ValueError(
                f'end_time ({self.end_time}) must be after '
                f'start_time ({self.start_time})'
            )

        # Location validation (same start/end is invalid)
        if (self.start_lat == self.end_lat and
            self.start_lon == self.end_lon):
            raise ValueError(
                'Start and end locations cannot be identical'
            )

        return self
```

### Project Example: Expression Validation

From `src/core/expression_evaluator.py`:

```python
from pydantic import BaseModel, Field, field_validator
import ast

class ComputedField(BaseModel):
    """Computed field with validated expression"""
    name: str = Field(..., pattern=r'^[a-z_][a-z0-9_]*$')
    expression: str = Field(..., max_length=500)

    @field_validator('expression')
    @classmethod
    def validate_expression_syntax(cls, v: str) -> str:
        """Validate expression is valid Python syntax"""
        try:
            # Parse as AST (safe, no execution)
            ast.parse(v, mode='eval')
        except SyntaxError as e:
            raise ValueError(f'Invalid expression syntax: {str(e)}')

        # Check length limit
        if len(v) > 500:
            raise ValueError('Expression too long (max 500 chars)')

        return v
```

### Reusable Custom Types

Create custom types with built-in validation:

```python
from pydantic import field_validator
from typing import Annotated
import re

def validate_pigeon_number(v: str) -> str:
    """Validate pigeon number format: XX-YYYY-NNN"""
    pattern = r'^[A-Z]{2}-\d{4}-\d{3}$'
    if not re.match(pattern, v):
        raise ValueError(
            f'Invalid pigeon number format: {v}. '
            f'Expected format: XX-YYYY-NNN (e.g., TW-2025-001)'
        )
    return v

# Create annotated type for reuse
PigeonNumber = Annotated[str, field_validator(validate_pigeon_number)]

class Track(BaseModel):
    pigeon_number: PigeonNumber
    race_id: int

class Result(BaseModel):
    pigeon_number: PigeonNumber
    rank: int
```

---

## 6. Serialization Customization

### model_dump() Configuration

Control serialization output with `model_dump()`:

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    password_hash: str = Field(exclude=True)  # Never serialize
    api_key: Optional[str] = None
    created_at: datetime

    def to_public_dict(self):
        """Serialize without sensitive fields"""
        return self.model_dump(
            exclude={'password_hash', 'api_key'},
            exclude_none=True
        )

    def to_internal_dict(self):
        """Serialize with all fields for internal use"""
        return self.model_dump(exclude_none=True)
```

### response_model Configuration in FastAPI

Control response serialization at the route level:

```python
from fastapi import APIRouter

router = APIRouter()

@router.get(
    "/tracks/{track_id}",
    response_model=TrackResponse,
    response_model_exclude_none=True,  # Skip None values
    response_model_exclude_unset=True,  # Skip unset values
)
async def get_track(track_id: int):
    return await track_repo.get(track_id)

# Alternative: Exclude specific fields
@router.get(
    "/tracks/{track_id}/summary",
    response_model=TrackResponse,
    response_model_exclude={'processing_metadata', 'raw_gpx_hash'}
)
async def get_track_summary(track_id: int):
    return await track_repo.get(track_id)

# Include only specific fields
@router.get(
    "/tracks/{track_id}/basic",
    response_model=TrackResponse,
    response_model_include={'id', 'pigeon_number', 'total_points'}
)
async def get_track_basic(track_id: int):
    return await track_repo.get(track_id)
```

### Computed Fields

Define fields that are computed at serialization time:

```python
from pydantic import BaseModel, computed_field

class Track(BaseModel):
    pigeon_number: str
    total_points: int
    suspicious_points: int

    @computed_field
    @property
    def suspicion_rate(self) -> float:
        """Calculate percentage of suspicious points"""
        if self.total_points == 0:
            return 0.0
        return round((self.suspicious_points / self.total_points) * 100, 2)

# Usage
track = Track(pigeon_number="TW-2025-001", total_points=500, suspicious_points=50)
print(track.model_dump())
# Output: {'pigeon_number': 'TW-2025-001', 'total_points': 500,
#          'suspicious_points': 50, 'suspicion_rate': 10.0}
```

### Custom Serializers

Customize how specific fields are serialized:

```python
from pydantic import BaseModel, field_serializer
from datetime import datetime

class Event(BaseModel):
    name: str
    timestamp: datetime

    @field_serializer('timestamp')
    def serialize_timestamp(self, value: datetime, _info):
        """Serialize timestamp as ISO format string"""
        return value.isoformat()
```

---

## 7. Config Options (ConfigDict)

### Common ConfigDict Options

```python
from pydantic import BaseModel, ConfigDict

class Track(BaseModel):
    model_config = ConfigDict(
        # ORM Integration
        from_attributes=True,  # Enable ORM mode (read from objects)

        # Field Names
        populate_by_name=True,  # Allow field name or alias

        # Validation
        validate_assignment=True,  # Validate when assigning to fields
        validate_default=True,  # Validate default values
        strict=False,  # Allow type coercion

        # Serialization
        use_enum_values=True,  # Serialize enums to their values

        # JSON Schema
        json_schema_extra={
            "example": {
                "pigeon_number": "TW-2025-001",
                "total_points": 500
            }
        },

        # Extra Fields
        extra='forbid',  # Forbid extra fields ('allow', 'ignore', 'forbid')
    )
```

### ConfigDict Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `from_attributes` | `False` | Enable ORM mode (v1: orm_mode) |
| `populate_by_name` | `False` | Allow field name or alias (v1: allow_population_by_field_name) |
| `validate_assignment` | `False` | Validate on assignment |
| `validate_default` | `False` | Validate default values |
| `strict` | `False` | Strict type validation (no coercion) |
| `extra` | `'ignore'` | Handle extra fields: 'allow', 'ignore', 'forbid' |
| `use_enum_values` | `False` | Serialize enums to values |
| `json_schema_extra` | `None` | Extra JSON schema metadata |
| `str_strip_whitespace` | `False` | Strip whitespace from strings |
| `str_to_lower` | `False` | Convert strings to lowercase |
| `str_to_upper` | `False` | Convert strings to uppercase |

### Project Recommended Settings

```python
from pydantic import BaseModel, ConfigDict

class ProjectBaseModel(BaseModel):
    """Base model for all project models"""
    model_config = ConfigDict(
        from_attributes=True,  # Support database objects
        validate_assignment=True,  # Catch errors on modification
        str_strip_whitespace=True,  # Clean user input
        extra='forbid',  # Prevent typos in field names
    )

# All models inherit from this
class TrackCreate(ProjectBaseModel):
    pigeon_number: str
    race_id: int
```

---

## 8. Project Integration

### How to Add Validators in This Project

**Step 1: Identify the Model**

Models in this project are typically in:
- `src/api/main.py` (inline models)
- Future: `src/models/` or `src/schemas/` directory

**Step 2: Add Field Validators**

Example: Validate pigeon number format

```python
from pydantic import BaseModel, field_validator
import re

class TrackCreate(BaseModel):
    pigeon_number: str
    race_id: int
    gpx_data: str

    @field_validator('pigeon_number')
    @classmethod
    def validate_pigeon_number(cls, v: str) -> str:
        """Validate pigeon number format: XX-YYYY-NNN"""
        pattern = r'^[A-Z]{2}-\d{4}-\d{3}$'
        if not re.match(pattern, v):
            raise ValueError(
                f'Invalid pigeon number format. Expected XX-YYYY-NNN, got: {v}'
            )
        return v.upper()  # Normalize to uppercase
```

**Step 3: Add Model Validators**

Example: Validate expression references allowed fields

```python
from pydantic import BaseModel, model_validator
from typing_extensions import Self

class ComputedField(BaseModel):
    name: str
    expression: str

class FilterRule(BaseModel):
    name: str
    computed_fields: list[ComputedField]
    conditions: list[dict]

    @model_validator(mode='after')
    def validate_computed_field_usage(self) -> Self:
        """Ensure computed fields referenced in conditions exist"""
        computed_names = {cf.name for cf in self.computed_fields}

        for condition in self.conditions:
            field = condition.get('field', '')
            if field.startswith('computed_'):
                field_name = field[9:]  # Remove 'computed_' prefix
                if field_name not in computed_names:
                    raise ValueError(
                        f"Condition references undefined computed field: {field_name}"
                    )

        return self
```

### Integration with Expression Validator

The project has a custom expression validator in `src/core/expression_evaluator.py`. You can integrate Pydantic validation with it:

```python
from pydantic import BaseModel, field_validator
from src.core.expression_evaluator import ExpressionValidator

class ComputedField(BaseModel):
    name: str
    expression: str

    @field_validator('expression')
    @classmethod
    def validate_expression(cls, v: str) -> str:
        """Validate expression using project's ExpressionValidator"""
        validator = ExpressionValidator()
        try:
            result = validator.validate(v)
            # result contains: {'valid': True, 'fields': [...], 'functions': [...]}
            return v
        except ValueError as e:
            # Re-raise with Pydantic validation error
            raise ValueError(f'Invalid expression: {str(e)}')
```

### Adding New Auxiliary Fields

When adding new auxiliary fields (like `vibration_amplitude`):

**Step 1: Update Database Schema**

```sql
ALTER TABLE track_points ADD COLUMN vibration_amplitude DOUBLE PRECISION;
```

**Step 2: Update ExpressionValidator Whitelist**

```python
# In src/core/expression_evaluator.py
class ExpressionValidator:
    ALLOWED_FIELDS = {
        # ... existing fields ...
        'vibration_amplitude',  # Add new field
        'wing_beat_amplitude',
    }
```

**Step 3: Add to Response Model**

```python
class TrackPointResponse(BaseModel):
    latitude: float
    longitude: float
    altitude: float
    vibration_amplitude: float | None = None  # New field

    model_config = ConfigDict(from_attributes=True)
```

**Step 4: Add Validation (Optional)**

```python
class TrackPointResponse(BaseModel):
    vibration_amplitude: float | None = None

    @field_validator('vibration_amplitude')
    @classmethod
    def validate_vibration(cls, v: float | None) -> float | None:
        """Validate vibration amplitude is in valid range (0-150mm)"""
        if v is not None and not 0 <= v <= 150:
            raise ValueError('Vibration amplitude must be between 0-150mm')
        return v
```

---

## 9. Common Pitfalls

### 1. Not Using Optional for Nullable Fields

**Problem:**

```python
# WRONG: Causes mypy errors
class Track(BaseModel):
    description: str = None
```

**Solution:**

```python
# CORRECT
from typing import Optional

class Track(BaseModel):
    description: Optional[str] = None
    # or in Python 3.10+
    description: str | None = None
```

### 2. Database Calls in Validators

**Problem:**

```python
# WRONG: Database calls in validator
class Track(BaseModel):
    race_id: int

    @field_validator('race_id')
    @classmethod
    def validate_race_exists(cls, v):
        # Don't do database queries in validators!
        if not db.query(Race).filter(Race.id == v).first():
            raise ValueError("Race not found")
        return v
```

**Why it's bad:**
- Validators run during model instantiation
- Can't be async
- Tight coupling to database
- Harder to test

**Solution:**

```python
# CORRECT: Validate in route/service layer
@router.post("/tracks")
async def create_track(
    track: TrackCreate,
    race_repo = Depends(get_race_repo)
):
    # Validate race exists here
    race = await race_repo.get(track.race_id)
    if not race:
        raise HTTPException(404, "Race not found")
    # ... proceed with track creation
```

### 3. Validators with Side Effects

**Problem:**

```python
# WRONG: Validator with side effects
@field_validator('email')
@classmethod
def validate_email(cls, v):
    # Validation
    if '@' not in v:
        raise ValueError("Invalid email")
    # Transformation
    v = v.lower()
    # Side effects (BAD!)
    send_verification_email(v)
    return v
```

**Why it's bad:**
- Validators run during parsing, not just at endpoint entry
- Can trigger multiple times (e.g., during testing)
- Unpredictable behavior

**Solution:**

```python
# CORRECT: Separate concerns
@field_validator('email')
@classmethod
def validate_and_normalize_email(cls, v):
    if '@' not in v:
        raise ValueError("Invalid email")
    return v.lower().strip()

# Send email in route handler
@router.post("/users")
async def create_user(user: UserCreate):
    # Create user first
    new_user = await user_repo.create(user)
    # Then send email
    await send_verification_email(new_user.email)
    return new_user
```

### 4. Forgetting mode='after' When Needed

**Problem:**

```python
@field_validator('created_at')
@classmethod
def validate_timestamp(cls, v):
    # v could be string, int, or datetime (depends on input)
    if v > datetime.now():  # TypeError if v is string!
        raise ValueError("Cannot be in the future")
    return v
```

**Solution:**

```python
# Use mode='after' to get typed value
@field_validator('created_at', mode='after')
@classmethod
def validate_timestamp(cls, v: datetime):
    # v is guaranteed to be datetime
    if v > datetime.now():
        raise ValueError("Cannot be in the future")
    return v
```

### 5. Not Using @classmethod Decorator

**Problem:**

```python
# WRONG: Missing @classmethod
@field_validator('email')
def validate_email(cls, v):  # cls will be the value, not the class!
    return v.lower()
```

**Solution:**

```python
# CORRECT: Always use @classmethod
@field_validator('email')
@classmethod
def validate_email(cls, v):
    return v.lower()
```

### 6. Excessive Validation Logic

**Problem:**

```python
@field_validator('expression')
@classmethod
def validate_expression(cls, v: str) -> str:
    # Too much logic in validator
    # - 100+ lines of parsing
    # - Complex state management
    # - Multiple database lookups
    return v
```

**Solution:**

```python
# CORRECT: Delegate to service class
@field_validator('expression')
@classmethod
def validate_expression(cls, v: str) -> str:
    from src.core.expression_evaluator import ExpressionValidator
    validator = ExpressionValidator()
    validator.validate(v)  # Raises ValueError if invalid
    return v
```

### 7. Mutable Default Values

**Problem:**

```python
# WRONG: Mutable default
class FilterRule(BaseModel):
    tags: list[str] = []  # Shared across instances!
```

**Solution:**

```python
# CORRECT: Use default_factory
from pydantic import Field

class FilterRule(BaseModel):
    tags: list[str] = Field(default_factory=list)
```

---

## 10. Reference Links

### Official Documentation

- [Pydantic v2 Documentation](https://docs.pydantic.dev/latest/)
- [Pydantic v2 Validators](https://docs.pydantic.dev/latest/concepts/validators/)
- [Pydantic v2 Field Validators](https://docs.pydantic.dev/latest/api/functional_validators/#pydantic.functional_validators.field_validator)
- [Pydantic v2 Model Validators](https://docs.pydantic.dev/latest/api/functional_validators/#pydantic.functional_validators.model_validator)
- [Pydantic v2 Migration Guide](https://docs.pydantic.dev/latest/migration/)
- [FastAPI Response Model](https://fastapi.tiangolo.com/tutorial/response-model/)
- [FastAPI Extra Data Types](https://fastapi.tiangolo.com/tutorial/extra-data-types/)

### Tutorials & Articles

- [Real Python - Pydantic Tutorial](https://realpython.com/python-pydantic/)
- [FastAPI Custom Validations](https://medium.com/@mojimich2015/fastapi-custom-validations-using-pydantic-c417d0e99020)
- [Pydantic v2 Changes Explained](https://blog.devgenius.io/pydantic-v2-is-here-a-huge-leap-for-data-validation-in-python-6fc3307c0e0f)

### Project-Specific References

- **Expression Validator**: `/Users/tf/Downloads/軌跡filter/src/core/expression_evaluator.py`
- **GPX Field Specification**: `spec/gpx-data-specification/gpx-fields-specification-v2.1.md`
- **API Main File**: `src/api/main.py`

### Community Resources

- [Pydantic GitHub Discussions](https://github.com/pydantic/pydantic/discussions)
- [FastAPI GitHub Discussions](https://github.com/tiangolo/fastapi/discussions)
- [Stack Overflow - Pydantic Tag](https://stackoverflow.com/questions/tagged/pydantic)

---

**Last Updated:** 2025-11-10
**Pydantic Version:** 2.5.3+
**Python Version:** 3.8+
**Project:** Pigeon Racing Track Filter System
