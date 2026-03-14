# Phase 9 Complete ✅

## Backend Graph Models & API

### What's New in Phase 9

**Backend Implementation - 9 New Files:**
- Database configuration
- 3 Database models (Node, Edge, Graph)
- Pydantic schemas for validation
- Graph service with CRUD operations
- REST API routes
- Updated main.py with database initialization

**Frontend:**
- No changes (Phase 8 frontend unchanged)

## Installation

### Backend Setup

```bash
cd openpulse-phase9/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
python -m uvicorn main:app --reload --port 8001
```

### Frontend (Same as Phase 8)

```bash
cd openpulse-phase9/frontend
npm install
npm run dev
```

## What You Get

### 🗄️ Database Layer

**SQLite Database** (Development)
- Location: `openpulse.db` (created automatically)
- Async SQLAlchemy ORM
- Three tables: `nodes`, `edges`, `graphs`

**PostgreSQL Ready** (Production)
- Uncomment in requirements.txt
- Update DATABASE_URL in .env

### 📊 Database Models

**NodeModel:**
```python
- id: String (Primary Key)
- label: String
- type: Enum (9 types)
- position_x, position_y, position_z: Float
- risk_score: Float (nullable)
- metadata: JSON
- created_at, updated_at: DateTime
```

**EdgeModel:**
```python
- id: String (Primary Key)
- source: String (Foreign Key → nodes.id)
- target: String (Foreign Key → nodes.id)
- weight: Float
- label: String (nullable)
- created_at, updated_at: DateTime
```

**GraphModel:**
```python
- id: String (Primary Key)
- name: String
- description: Text
- created_at, updated_at: DateTime
```

### 🔌 REST API Endpoints

**Graph Data:**
- `GET /api/graph/data` - Get all nodes and edges
- `POST /api/graph/data` - Create graph data (bulk)
- `DELETE /api/graph/data` - Clear all graph data

**Nodes:**
- `GET /api/graph/nodes` - List all nodes
- `POST /api/graph/nodes` - Create node
- `GET /api/graph/nodes/{id}` - Get specific node
- `PUT /api/graph/nodes/{id}` - Update node
- `DELETE /api/graph/nodes/{id}` - Delete node

**Edges:**
- `GET /api/graph/edges` - List all edges
- `POST /api/graph/edges` - Create edge
- `GET /api/graph/edges/{id}` - Get specific edge
- `DELETE /api/graph/edges/{id}` - Delete edge

**Health:**
- `GET /` - API info
- `GET /health` - Health check

### 📋 API Documentation

Once backend is running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Testing the API

### 1. Start Backend

```bash
cd backend
python -m uvicorn main:app --reload --port 8001
```

### 2. Check API Status

```bash
curl http://localhost:8001
```

Response:
```json
{
  "message": "OpenPulse API",
  "version": "0.2.0",
  "status": "Phase 9 Complete - Backend Graph Models"
}
```

### 3. View API Docs

Open browser: `http://localhost:8001/docs`

You'll see interactive API documentation!

### 4. Create Sample Node

```bash
curl -X POST http://localhost:8001/api/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "node-1",
    "label": "Test Node",
    "type": "service",
    "position": [0, 0, 0],
    "riskScore": 0.5,
    "metadata": {"test": true}
  }'
```

### 5. Get All Nodes

```bash
curl http://localhost:8001/api/graph/nodes
```

### 6. Create Graph Data (Bulk)

```bash
curl -X POST http://localhost:8001/api/graph/data \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {
        "id": "node-1",
        "label": "Node 1",
        "type": "service",
        "position": [0, 0, 0]
      },
      {
        "id": "node-2",
        "label": "Node 2",
        "type": "library",
        "position": [5, 0, 0]
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "weight": 1.0
      }
    ]
  }'
```

## File Structure

```
backend/
├── app/
│   ├── api/
│   │   └── graph.py              # NEW - API routes
│   ├── models/
│   │   ├── __init__.py           # UPDATED
│   │   ├── node.py               # NEW - Node model
│   │   ├── edge.py               # NEW - Edge model
│   │   ├── graph.py              # NEW - Graph model
│   │   └── schemas.py            # NEW - Pydantic schemas
│   ├── services/
│   │   └── graph_service.py      # NEW - CRUD operations
│   ├── core/
│   │   └── database.py           # NEW - DB config
│   └── __init__.py
├── main.py                       # UPDATED - with DB init
├── requirements.txt              # UPDATED - with SQLAlchemy
└── .env.example                  # UNCHANGED
```

## Features Implemented

### ✅ Database Layer
- Async SQLAlchemy ORM
- SQLite for development
- PostgreSQL-ready for production
- Automatic table creation
- Foreign key constraints

### ✅ Data Models
- Node model with 9 types
- Edge model with relationships
- Graph model for metadata
- Timestamps (created_at, updated_at)
- JSON metadata field

### ✅ API Layer
- RESTful endpoints
- Pydantic validation
- Error handling
- CORS configured
- Auto-generated docs

### ✅ CRUD Operations
- Create nodes and edges
- Read single or list
- Update node properties
- Delete nodes and edges
- Bulk create
- Clear all data

## Architecture

```
Frontend (Phase 8)
      ↓ HTTP
Backend API (FastAPI)
      ↓
Graph Service (Business Logic)
      ↓
Database Models (SQLAlchemy)
      ↓
SQLite Database
```

## Data Flow

```
1. Client → POST /api/graph/nodes
2. FastAPI validates with Pydantic
3. GraphService creates NodeModel
4. SQLAlchemy inserts to database
5. Returns NodeResponse to client
```

## Database Schema

```sql
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    position_x REAL,
    position_y REAL,
    position_z REAL,
    risk_score REAL,
    metadata JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE edges (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    weight REAL,
    label TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (source) REFERENCES nodes(id),
    FOREIGN KEY (target) REFERENCES nodes(id)
);

CREATE TABLE graphs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Node Types Supported

```python
class NodeType(Enum):
    SERVICE = "service"
    LIBRARY = "library"
    REPOSITORY = "repository"
    DATABASE = "database"
    API = "api"
    SERVER = "server"
    IP = "ip"
    THREAT = "threat"
    VULNERABILITY = "vulnerability"
```

## Example API Workflows

### Workflow 1: Create and Query

```bash
# Create a node
curl -X POST http://localhost:8001/api/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{"id": "svc-1", "label": "API Service", "type": "service", "position": [0,0,0]}'

# Get all nodes
curl http://localhost:8001/api/graph/nodes

# Get specific node
curl http://localhost:8001/api/graph/nodes/svc-1

# Update node
curl -X PUT http://localhost:8001/api/graph/nodes/svc-1 \
  -H "Content-Type: application/json" \
  -d '{"riskScore": 0.8}'

# Delete node
curl -X DELETE http://localhost:8001/api/graph/nodes/svc-1
```

### Workflow 2: Bulk Operations

```bash
# Create full graph
curl -X POST http://localhost:8001/api/graph/data \
  -H "Content-Type: application/json" \
  -d @sample_graph.json

# Get all data
curl http://localhost:8001/api/graph/data

# Clear everything
curl -X DELETE http://localhost:8001/api/graph/data
```

## Environment Configuration

### .env file

```bash
# Database
DATABASE_URL=sqlite+aiosqlite:///./openpulse.db

# For PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost/openpulse

# CORS
CORS_ORIGINS=http://localhost:3000
```

## Development Tools

### Swagger UI
- Interactive API testing
- Try all endpoints
- See request/response schemas
- http://localhost:8001/docs

### ReDoc
- Alternative API documentation
- Clean, readable format
- http://localhost:8001/redoc

### Database Browser
```bash
# Install sqlite3
# View database:
sqlite3 openpulse.db
.tables
.schema nodes
SELECT * FROM nodes;
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `404 Not Found` - Resource doesn't exist
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

Example error response:
```json
{
  "detail": "Node not found"
}
```

## What's Next

**Phase 10** will:
- Connect frontend to backend
- Replace sample data with API calls
- Fetch graph data from database
- Save user interactions
- Real-time synchronization

The backend is now ready to serve graph data!

## Troubleshooting

### Database locked error
```bash
# Close other connections to the database
# Or delete openpulse.db and restart
rm openpulse.db
python -m uvicorn main:app --reload --port 8001
```

### Module import errors
```bash
# Make sure you're in venv
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### CORS errors from frontend
```bash
# Check CORS origins in main.py include http://localhost:3000
# Restart backend after changes
```

## Success Criteria

- [x] Database models created
- [x] API routes implemented
- [x] CRUD operations working
- [x] Swagger docs accessible
- [x] Sample data can be created
- [x] Nodes and edges persist
- [x] Validation working
- [x] Error handling in place

**Phase 9 Status: Complete ✅**

Ready for Phase 10: API Integration with Frontend!