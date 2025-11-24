# Error Handling and Logging

## Table of Contents

1. [Overview](#1-overview)
2. [Current Project Error Handling](#2-current-project-error-handling)
3. [Custom Exception Hierarchy](#3-custom-exception-hierarchy)
4. [Global Exception Handlers](#4-global-exception-handlers)
5. [Structured Logging](#5-structured-logging)
6. [Production Monitoring](#6-production-monitoring)
7. [Safe Expression Evaluation](#7-safe-expression-evaluation)
8. [Project Integration](#8-project-integration)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Reference Links](#10-reference-links)

---

## 1. Overview

Error handling and logging are critical components of production FastAPI applications. Proper implementation provides:

- **User-friendly error messages** - Clear, actionable feedback for API consumers
- **Security** - Prevents leaking sensitive information in error responses
- **Observability** - Structured logs enable effective debugging and monitoring
- **Reliability** - Graceful degradation and proper error propagation

**Key Principles:**

1. **Fail fast, fail loud** - Detect and report errors early
2. **Context is king** - Include request IDs, user IDs, and operation context
3. **Separate concerns** - Different error types (validation, business logic, system)
4. **Production-ready** - JSON logging for aggregation, sanitized error responses

---

## 2. Current Project Error Handling

### Expression Validator Error Patterns

The project's `src/core/expression_evaluator.py` demonstrates safe error handling for user-provided expressions:

```python
class ExpressionValidator:
    """Expression validator - validates expression safety"""

    def validate(self, expression: str) -> Dict[str, Any]:
        """Validate expression"""
        # 1. Length check
        if len(expression) > 500:
            raise ValueError("Expression must not exceed 500 characters")

        # 2. Parse as AST
        try:
            tree = ast.parse(expression, mode='eval')
        except SyntaxError as e:
            raise ValueError(f"Syntax error: {str(e)}")

        # 3. Check field names
        fields = self._extract_fields(tree)
        invalid_fields = fields - self.ALLOWED_FIELDS
        if invalid_fields:
            raise ValueError(f"Disallowed fields: {', '.join(invalid_fields)}")

        # 4. Check functions
        functions = self._extract_functions(tree)
        invalid_functions = functions - self.ALLOWED_FUNCTIONS
        if invalid_functions:
            raise ValueError(f"Disallowed functions: {', '.join(invalid_functions)}")

        # 5. Check nesting depth
        depth = self._get_nesting_depth(tree.body)
        if depth > 10:
            raise ValueError("Expression nesting too deep (max 10 levels)")

        return {
            'valid': True,
            'fields': list(fields),
            'functions': list(functions),
            'depth': depth
        }
```

**Key Patterns:**

1. **Specific error messages** - "Expression must not exceed 500 characters" (not "Invalid expression")
2. **Security-first validation** - Whitelist approach for fields and functions
3. **Context in errors** - Include invalid field/function names in error message
4. **Depth limits** - Prevent stack overflow attacks

### Expression Evaluator Error Patterns

```python
class ExpressionEvaluator:
    """Expression evaluator - safely execute expressions"""

    def evaluate(self, expression: str, context: Dict[str, Any]) -> Any:
        """
        Evaluate expression

        Args:
            expression: Expression string
            context: Field value dictionary

        Returns:
            Evaluation result
        """
        # Validate expression
        self.validator.validate(expression)

        # Parse as AST
        tree = ast.parse(expression, mode='eval')

        # Execute evaluation
        try:
            return self._eval_node(tree.body, context)
        except Exception as e:
            raise ValueError(f"Expression execution error: {str(e)}")

    def _eval_node(self, node, context: Dict[str, Any]) -> Any:
        """Recursively evaluate AST node"""

        # Handle None values gracefully
        if left is None or right is None:
            return None

        # Validate operators
        op_func = self.OPERATORS.get(type(node.op))
        if not op_func:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")

        return op_func(left, right)
```

**Key Patterns:**

1. **Graceful None handling** - Return None instead of crashing
2. **Operator validation** - Whitelist-based operator checking
3. **Wrapped exceptions** - "Expression execution error: ..." provides context
4. **Type information** - Include operator/node type in error messages

---

## 3. Custom Exception Hierarchy

### Design Pattern

Create a hierarchy of domain-specific exceptions that inherit from `HTTPException`:

```python
# app/exceptions.py
from fastapi import HTTPException, status

class TrackFilterException(HTTPException):
    """Base exception for track filter domain"""
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str,
        **kwargs
    ):
        super().__init__(
            status_code=status_code,
            detail=detail,
            headers={"X-Error-Code": error_code},
            **kwargs
        )

class TrackNotFoundException(TrackFilterException):
    def __init__(self, track_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Track {track_id} not found",
            error_code="TRACK_NOT_FOUND"
        )

class InvalidExpressionException(TrackFilterException):
    def __init__(self, expression: str, reason: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid expression '{expression}': {reason}",
            error_code="INVALID_EXPRESSION"
        )

class AuxiliaryCalculationException(TrackFilterException):
    def __init__(self, track_id: int, field: str, error: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate {field} for track {track_id}: {error}",
            error_code="AUXILIARY_CALC_FAILED"
        )

class DatabaseConnectionException(TrackFilterException):
    def __init__(self, error: str):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {error}",
            error_code="DB_CONNECTION_FAILED"
        )

class FilterExecutionException(TrackFilterException):
    def __init__(self, rule_name: str, error: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Filter rule '{rule_name}' execution failed: {error}",
            error_code="FILTER_EXEC_FAILED"
        )
```

### Usage in Routes

```python
from app.exceptions import (
    InvalidExpressionException,
    TrackNotFoundException,
    AuxiliaryCalculationException
)

@router.post("/filter/validate-expression")
async def validate_expression(request: ExpressionRequest):
    """Validate user-provided expression"""
    try:
        validator = ExpressionValidator()
        result = validator.validate(request.expression)
        return {"valid": True, "result": result}
    except ValueError as e:
        # Convert ValueError to domain exception
        raise InvalidExpressionException(
            expression=request.expression,
            reason=str(e)
        )

@router.get("/tracks/{track_id}")
async def get_track(
    track_id: int,
    track_repo = Depends(get_track_repo)
):
    track = await track_repo.get(track_id)
    if not track:
        raise TrackNotFoundException(track_id)
    return track

@router.post("/races/{race_id}/calculate-auxiliary")
async def calculate_auxiliary(
    race_id: int,
    calculator = Depends(get_auxiliary_calculator)
):
    try:
        result = await calculator.calculate_all(race_id)
        return result
    except psycopg2.DatabaseError as e:
        raise DatabaseConnectionException(str(e))
    except Exception as e:
        # Catch calculation-specific errors
        raise AuxiliaryCalculationException(
            track_id=0,  # Or specific track if known
            field="multiple",
            error=str(e)
        )
```

### Benefits

1. **Type safety** - Catch specific exception types
2. **Consistent error codes** - "TRACK_NOT_FOUND" across all endpoints
3. **Rich context** - track_id, expression, field name included
4. **Centralized handling** - Single exception handler for all domain exceptions

---

## 4. Global Exception Handlers

### Standard HTTPException Handler

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

@app.exception_handler(TrackFilterException)
async def track_filter_exception_handler(
    request: Request,
    exc: TrackFilterException
):
    """Handle domain-specific exceptions"""
    logger.error(
        f"TrackFilterException: {exc.detail}",
        extra={
            "error_code": exc.headers.get("X-Error-Code"),
            "path": request.url.path,
            "method": request.method
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.headers.get("X-Error-Code"),
                "message": exc.detail,
                "path": request.url.path,
                "timestamp": datetime.utcnow().isoformat()
            }
        },
        headers=exc.headers
    )
```

### Pydantic Validation Error Handler

```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    """Handle Pydantic validation errors"""
    # Format validation errors
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    logger.warning(
        f"Validation error: {len(errors)} fields failed",
        extra={
            "path": request.url.path,
            "errors": errors
        }
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors,
                "path": request.url.path
            }
        }
    )
```

### Global Catch-All Handler

```python
@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):
    """Catch-all for unhandled exceptions"""
    logger.exception(
        f"Unhandled exception: {type(exc).__name__}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "exception_type": type(exc).__name__
        }
    )

    # Don't leak internal errors in production
    if settings.ENVIRONMENT == "production":
        detail = "Internal server error"
    else:
        detail = f"{type(exc).__name__}: {str(exc)}"

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": detail,
                "path": request.url.path,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )
```

### Standardized Error Response Model

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ErrorDetail(BaseModel):
    """Single error detail (for validation errors)"""
    field: str
    message: str
    type: str

class ErrorResponse(BaseModel):
    """Standardized error response"""
    code: str
    message: str
    path: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[List[ErrorDetail]] = None
    trace_id: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "TRACK_NOT_FOUND",
                "message": "Track with ID 123 not found",
                "path": "/api/v1/tracks/123",
                "timestamp": "2025-11-08T10:30:00Z",
                "trace_id": "a1b2c3d4-e5f6-7890"
            }
        }
    )
```

**Example Error Response:**

```json
{
  "error": {
    "code": "INVALID_EXPRESSION",
    "message": "Invalid expression 'altitude - unknown_field': Disallowed fields: unknown_field",
    "path": "/api/filter/validate-expression",
    "timestamp": "2025-11-08T14:23:45.123Z",
    "trace_id": "req-abc123"
  }
}
```

---

## 5. Structured Logging

### Structlog Configuration

**Development vs Production Logging:**

```python
# app/core/logging.py
import structlog
import logging.config
from pythonjsonlogger import jsonlogger

def setup_logging(environment: str = "development"):
    """
    Setup structured logging with structlog.

    Development: Human-readable console output
    Production: JSON output for log aggregation
    """

    if environment == "production":
        # JSON logging for production
        logging.config.dictConfig({
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "()": jsonlogger.JsonFormatter,
                    "format": "%(asctime)s %(name)s %(levelname)s %(message)s"
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "stream": "ext://sys.stdout"
                },
                "file": {
                    "class": "logging.handlers.RotatingFileHandler",
                    "formatter": "json",
                    "filename": "/var/log/app/app.log",
                    "maxBytes": 10485760,  # 10MB
                    "backupCount": 5
                }
            },
            "root": {
                "level": "INFO",
                "handlers": ["console", "file"]
            }
        })

        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        # Pretty console logging for development
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.dev.ConsoleRenderer()  # Colored output
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

# In main.py
from app.core.logging import setup_logging

setup_logging(environment=settings.ENVIRONMENT)
logger = structlog.get_logger(__name__)
```

### Request ID Tracking

**Middleware for Request Context:**

```python
import uuid
from fastapi import Request
import structlog

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Add request context to all logs"""
    request_id = str(uuid.uuid4())

    # Bind context to logger for this request
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host
    )

    logger = structlog.get_logger()
    logger.info("Request started")

    response = await call_next(request)

    logger.info(
        "Request completed",
        status_code=response.status_code
    )

    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id

    return response
```

### Logging in Route Handlers

```python
@router.post("/filter/execute")
async def execute_filter(rule: FilterRule):
    logger = structlog.get_logger(__name__)

    logger.info(
        "Executing filter rule",
        rule_name=rule.name,
        conditions_count=len(rule.conditions),
        computed_fields_count=len(rule.computed_fields)
    )

    try:
        result = await filter_engine.execute(rule)

        logger.info(
            "Filter executed successfully",
            suspicious_tracks=result.suspicious_count,
            total_tracks=result.total_tracks,
            execution_time_ms=result.execution_time
        )

        return result
    except InvalidExpressionException as e:
        logger.warning(
            "Invalid expression in filter rule",
            expression=e.detail,
            error_code=e.headers.get("X-Error-Code")
        )
        raise
    except Exception as e:
        logger.error(
            "Filter execution failed",
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True
        )
        raise
```

**Example Production Log Output (JSON):**

```json
{
  "timestamp": "2025-11-08T14:23:45.123Z",
  "level": "info",
  "logger": "app.api.filter",
  "event": "Filter executed successfully",
  "request_id": "a1b2c3d4-e5f6-7890",
  "method": "POST",
  "path": "/api/filter/execute",
  "client_ip": "192.168.1.100",
  "rule_name": "Low Altitude Vehicle Transport",
  "suspicious_tracks": 5,
  "total_tracks": 25,
  "execution_time_ms": 234.56
}
```

### Log Level Strategies

```python
# DEBUG - Detailed flow for development
logger.debug(
    "Processing track point",
    track_id=track.id,
    point_index=i,
    latitude=point.latitude,
    longitude=point.longitude
)

# INFO - Important business events
logger.info(
    "Auxiliary fields calculated",
    race_id=race_id,
    total_points=point_count,
    duration_seconds=elapsed
)

# WARNING - Deprecated usage, recoverable errors
logger.warning(
    "Using deprecated field name",
    old_field="wing_flaps",
    new_field="wing_flaps_per_sec",
    track_id=track_id
)

# ERROR - Operation failures requiring intervention
logger.error(
    "PostGIS query failed",
    query="ST_DWithin",
    error=str(e),
    exc_info=True
)

# CRITICAL - System-level failures
logger.critical(
    "Database connection pool exhausted",
    active_connections=pool.size,
    max_connections=pool.max_size
)
```

### Uvicorn Logging Integration

```python
# app/core/logging.py (continued)

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(message)s",
            "use_colors": None,
        },
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": '%(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s',
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "uvicorn": {"handlers": ["default"], "level": "INFO"},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
    },
}

# In startup
import logging.config
logging.config.dictConfig(LOGGING_CONFIG)
```

---

## 6. Production Monitoring

### Log Aggregation

**ELK Stack (Elasticsearch, Logstash, Kibana):**

```python
# Send structured logs to Logstash
import logging
from pythonjsonlogger import jsonlogger

handler = logging.StreamHandler()
handler.setFormatter(jsonlogger.JsonFormatter())
logger.addHandler(handler)

# Logs will be collected by Logstash and indexed in Elasticsearch
# Query in Kibana: request_id:"a1b2c3d4" AND level:error
```

**Datadog Integration:**

```python
# Install: pip install ddtrace
from ddtrace import tracer, patch_all

patch_all()  # Auto-instrument FastAPI

# Logs automatically include trace_id and span_id
logger.info(
    "Filter executed",
    dd.trace_id=tracer.current_span().trace_id,
    dd.span_id=tracer.current_span().span_id
)
```

### Error Tracking

**Sentry Integration:**

```python
# Install: pip install sentry-sdk[fastapi]
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="https://your-sentry-dsn",
    integrations=[FastApiIntegration()],
    environment=settings.ENVIRONMENT,
    traces_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.1,
    profiles_sample_rate=0.1,
)

# Automatic error reporting
@router.post("/filter/execute")
async def execute_filter(rule: FilterRule):
    try:
        result = await filter_engine.execute(rule)
        return result
    except Exception as e:
        # Sentry automatically captures this exception
        # Add custom context
        sentry_sdk.set_context("filter_rule", {
            "name": rule.name,
            "conditions": len(rule.conditions)
        })
        sentry_sdk.capture_exception(e)
        raise
```

### Performance Monitoring

**Custom Metrics:**

```python
import time
from prometheus_client import Counter, Histogram

# Define metrics
filter_executions = Counter(
    'filter_executions_total',
    'Total filter executions',
    ['status']
)

filter_duration = Histogram(
    'filter_duration_seconds',
    'Filter execution duration'
)

@router.post("/filter/execute")
async def execute_filter(rule: FilterRule):
    start_time = time.time()

    try:
        result = await filter_engine.execute(rule)
        filter_executions.labels(status='success').inc()
        return result
    except Exception as e:
        filter_executions.labels(status='error').inc()
        raise
    finally:
        duration = time.time() - start_time
        filter_duration.observe(duration)
```

---

## 7. Safe Expression Evaluation

### Project-Specific Pattern

The project's expression evaluation system demonstrates best practices for handling user input:

**Security Layers:**

1. **Whitelist validation** - Only allowed fields and functions
2. **AST parsing** - Never use `eval()` or `exec()`
3. **Depth limits** - Prevent stack overflow
4. **Length limits** - Prevent resource exhaustion
5. **Graceful None handling** - Avoid crashes on missing data

**Error Handling Strategy:**

```python
# 1. Validation Phase
try:
    validator = ExpressionValidator()
    validation_result = validator.validate(expression)
except ValueError as e:
    # User-friendly error message
    raise InvalidExpressionException(
        expression=expression,
        reason=str(e)
    )

# 2. Evaluation Phase
try:
    evaluator = ExpressionEvaluator()
    result = evaluator.evaluate(expression, context)
except ValueError as e:
    # Execution error (division by zero, etc.)
    logger.error(
        "Expression evaluation failed",
        expression=expression,
        error=str(e),
        context_keys=list(context.keys())
    )
    raise FilterExecutionException(
        rule_name="computed_field",
        error=str(e)
    )
```

**Error Message Guidelines:**

```python
# GOOD: Specific, actionable error messages
raise ValueError("Expression must not exceed 500 characters")
raise ValueError(f"Disallowed fields: {', '.join(invalid_fields)}")
raise ValueError(f"Unsupported operator: {type(node.op).__name__}")

# BAD: Vague, unhelpful errors
raise ValueError("Invalid expression")
raise ValueError("Error")
raise Exception("Something went wrong")
```

**Logging Expression Errors:**

```python
@router.post("/filter/validate-expression")
async def validate_expression(request: ExpressionRequest):
    logger = structlog.get_logger(__name__)

    logger.debug(
        "Validating expression",
        expression=request.expression,
        length=len(request.expression)
    )

    try:
        validator = ExpressionValidator()
        result = validator.validate(request.expression)

        logger.info(
            "Expression validated successfully",
            fields_used=result['fields'],
            functions_used=result['functions'],
            depth=result['depth']
        )

        return {"valid": True, "result": result}
    except ValueError as e:
        logger.warning(
            "Expression validation failed",
            expression=request.expression,
            reason=str(e)
        )
        raise InvalidExpressionException(
            expression=request.expression,
            reason=str(e)
        )
```

---

## 8. Project Integration

### Adding Error Handling to Existing Code

**Step 1: Create exception hierarchy**

```bash
# Create exceptions module
touch src/exceptions.py
```

```python
# src/exceptions.py
from fastapi import HTTPException, status

class TrackFilterException(HTTPException):
    """Base exception for track filter domain"""
    def __init__(self, status_code: int, detail: str, error_code: str, **kwargs):
        super().__init__(
            status_code=status_code,
            detail=detail,
            headers={"X-Error-Code": error_code},
            **kwargs
        )

# Add specific exceptions for your domain...
```

**Step 2: Setup structured logging**

```bash
# Install dependencies
pip install structlog python-json-logger
```

```python
# src/core/logging.py
import structlog

def setup_logging(environment: str = "development"):
    # See Section 5 for full configuration
    pass
```

**Step 3: Configure global exception handlers**

```python
# src/api/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from src.exceptions import TrackFilterException
from src.core.logging import setup_logging
import structlog

# Setup logging
setup_logging(environment=os.getenv("ENVIRONMENT", "development"))
logger = structlog.get_logger(__name__)

app = FastAPI(title="Track Filter API")

@app.exception_handler(TrackFilterException)
async def domain_exception_handler(request: Request, exc: TrackFilterException):
    logger.error(
        "Domain exception",
        error_code=exc.headers.get("X-Error-Code"),
        detail=exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.headers.get("X-Error-Code"),
                "message": exc.detail,
                "path": request.url.path
            }
        }
    )

# Add middleware for request ID tracking
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    import uuid
    request_id = str(uuid.uuid4())

    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        path=request.url.path,
        method=request.method
    )

    logger.info("Request started")
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    logger.info("Request completed", status_code=response.status_code)

    return response
```

**Step 4: Update existing routes**

```python
# Before
@router.post("/filter/execute")
async def execute_filter(rule: FilterRule):
    result = filter_engine.execute(rule)
    return result

# After
@router.post("/filter/execute")
async def execute_filter(rule: FilterRule):
    logger = structlog.get_logger(__name__)

    logger.info("Executing filter rule", rule_name=rule.name)

    try:
        result = await filter_engine.execute(rule)
        logger.info("Filter executed", suspicious_count=result.suspicious_count)
        return result
    except ValueError as e:
        logger.warning("Invalid filter rule", error=str(e))
        raise InvalidExpressionException(expression=rule.expression, reason=str(e))
    except Exception as e:
        logger.error("Filter execution failed", error=str(e), exc_info=True)
        raise FilterExecutionException(rule_name=rule.name, error=str(e))
```

---

## 9. Common Pitfalls

### 1. Catching Exceptions Too Broadly

```python
# WRONG: Hides real errors
try:
    result = await some_operation()
except:  # Bare except!
    return {"error": "Something went wrong"}

# CORRECT: Catch specific exceptions
try:
    result = await some_operation()
except ValueError as e:
    logger.error(f"Invalid value: {e}")
    raise HTTPException(400, str(e))
except DatabaseError as e:
    logger.exception("Database error")
    raise HTTPException(500, "Database operation failed")
```

### 2. Logging Sensitive Information

```python
# WRONG: Logs password
logger.info(f"User login: {username}, password: {password}")

# WRONG: Logs full credit card
logger.info(f"Payment processed: {credit_card_number}")

# CORRECT: Redact sensitive data
logger.info(f"User login: {username}")
logger.info(f"Payment processed: {credit_card_number[-4:]}")
```

### 3. Not Using Log Levels Appropriately

```python
# WRONG: Everything is INFO
logger.info("Starting operation")
logger.info("Database connection failed!")  # Should be ERROR
logger.info("Deprecated field used")  # Should be WARNING

# CORRECT: Use appropriate levels
logger.debug("Starting operation")  # DEBUG for detailed flow
logger.error("Database connection failed!", exc_info=True)  # ERROR
logger.warning("Deprecated field 'old_name' used")  # WARNING
logger.info("Filter executed successfully")  # INFO for important events
```

### 4. Not Including exc_info in Error Logs

```python
# WRONG: Loses stack trace
except Exception as e:
    logger.error(f"Error: {e}")

# CORRECT: Include full exception info
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    # Or use logger.exception()
    logger.exception("Operation failed")
```

### 5. Creating New Loggers Incorrectly

```python
# WRONG: Hardcoded name
logger = logging.getLogger("my_logger")

# CORRECT: Use __name__ for proper hierarchy
logger = logging.getLogger(__name__)
# Or with structlog:
logger = structlog.get_logger(__name__)
```

### 6. Leaking Internal Details in Production

```python
# WRONG: Exposes internal implementation
raise HTTPException(500, f"Database query failed: {sql_query}")

# CORRECT: Generic message in production, detailed in logs
logger.error("Database query failed", query=sql_query, exc_info=True)
if settings.ENVIRONMENT == "production":
    raise HTTPException(500, "Internal server error")
else:
    raise HTTPException(500, f"Database query failed: {sql_query}")
```

### 7. Not Adding Request Context

```python
# WRONG: Logs without context
logger.error("Filter execution failed")

# CORRECT: Include request context
logger.error(
    "Filter execution failed",
    request_id=request_id,
    path=request.url.path,
    method=request.method,
    user_id=current_user.id
)
```

### 8. Ignoring Exception Hierarchy

```python
# WRONG: Catch base exception before specific ones
try:
    result = await operation()
except Exception as e:
    logger.error("Generic error")
except ValueError as e:  # Never reached!
    logger.error("Value error")

# CORRECT: Catch specific exceptions first
try:
    result = await operation()
except ValueError as e:
    logger.error("Value error")
except DatabaseError as e:
    logger.error("Database error")
except Exception as e:
    logger.error("Generic error")
```

---

## 10. Reference Links

### Official Documentation

- [FastAPI - Handling Errors](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [Structlog Documentation](https://www.structlog.org/)
- [Python Logging Documentation](https://docs.python.org/3/library/logging.html)
- [Pydantic - Error Handling](https://docs.pydantic.dev/latest/concepts/errors/)

### Best Practices & Guides

- [Better Stack - FastAPI Error Handling](https://betterstack.com/community/guides/scaling-python/error-handling-fastapi/)
- [Better Stack - Logging with FastAPI](https://betterstack.com/community/guides/logging/logging-with-fastapi/)
- [FastAPI Logging Best Practices](https://www.codingeasypeasy.com/blog/best-logging-practices-for-fastapi-in-production-enhance-monitoring-and-debugging)

### Monitoring & Observability

- [Sentry - FastAPI Integration](https://docs.sentry.io/platforms/python/guides/fastapi/)
- [Datadog - Python Logging](https://docs.datadoghq.com/logs/log_collection/python/)
- [Prometheus - Python Client](https://prometheus.io/docs/instrumenting/clientlibs/#python)

### Security

- [OWASP - Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [Python AST Module](https://docs.python.org/3/library/ast.html) (for safe expression evaluation)

---

**Last Updated:** 2025-11-10
**Version:** 1.0
**Skill:** python-fastapi-guidelines
