applyTo: 'simva/**'

# SIMVA API Documentation

## Overview

SIMVA (SIMple VAlidation service) is a comprehensive TypeScript/Express.js API for managing educational research studies, serious game validation, and learning analytics. The API enables researchers to create complex studies with various activity types, participant allocation, and detailed analytics tracking using xAPI statements. SIMVA integrates with LTI tools, Keycloak authentication, and LimeSurvey for comprehensive educational research workflows.

## Project Structure

```
simva/
├── src/
│   ├── @types/                     # TypeScript type definitions
│   ├── app.ts                      # Main Express application setup
│   ├── server.ts                   # Server entry point and initialization
│   ├── controlers/                 # Request handlers and validation [sic]
│   │   ├── activities/             # Activity management controllers
│   │   ├── activitiesTypes/        # Activity type metadata controllers
│   │   ├── allocatorTypes/         # Allocator type metadata controllers
│   │   ├── groups/                 # Group management controllers
│   │   │   └── group.controler.ts
│   │   ├── simlets/                # Study/simlet management controllers
│   │   │   └── simlet.controler.ts
│   │   └── users/                  # User management controllers
│   │       └── user.controler.ts
│   ├── routes/                     # Express route definitions
│   │   ├── activities/             # Activity-related routes
│   │   ├── activitiesTypes/        # Activity type routes
│   │   ├── allocatorsTypes/        # Allocator type routes
│   │   ├── groups/                 # Group management routes
│   │   │   └── group.routes.ts
│   │   ├── simlets/                # Study/simlet routes
│   │   │   └── simlet.routes.ts
│   │   └── users/                  # User management routes
│   ├── services/                   # Business logic layer
│   │   ├── index.ts               # Service exports
│   │   ├── activities/            # Activity-related services
│   │   │   ├── activities.service.ts
│   │   │   └── activitiesTypes.service.ts
│   │   ├── allocators/            # Allocator-related services
│   │   │   └── allocatorsTypes.service.ts
│   │   ├── groups/                # Group-related services
│   │   │   └── group.service.ts
│   │   ├── simlets/               # Study management services
│   │   │   └── simlet.service.ts
│   │   └── users/                 # User management services
│   │       └── user.auth.service.ts
│   ├── middlewares/               # Express middleware
│   │   ├── auth.middleware.ts     # JWT/Keycloak authentication
│   │   ├── error.middleware.ts    # Global error handling
│   │   └── index.ts              # Middleware exports
│   ├── lib/                      # Core utilities and configuration
│   │   ├── config.ts             # Application configuration
│   │   ├── db.ts                 # SQLite database connection setup
│   │   ├── logger.ts             # Pino logging configuration
│   │   ├── functions.ts          # Database utility functions
│   │   ├── keycloakKeyManager.ts # OAuth/Keycloak integration
│   │   ├── validateParams.ts     # Parameter validation utilities
│   │   ├── generateQueryDocs.ts  # Auto-documentation generator
│   │   ├── query_template.md     # Query template documentation
│   │   ├── errors/               # Error handling classes
│   │   │   └── appErrors.ts
│   │   ├── mappers/              # Object-relational mapping layer
│   │   │   ├── UserPermisions/   # User permission mappers
│   │   │   ├── activities/       # Activity mappers
│   │   │   ├── allocators/       # Allocator mappers
│   │   │   ├── group/            # Group mappers
│   │   │   ├── session/          # Session mappers
│   │   │   └── simlet/           # Simlet mappers
│   │   ├── models/               # Sequelize model definitions
│   │   │   ├── index.ts          # Model initialization and exports
│   │   │   ├── users/
│   │   │   │   └── user.model.ts
│   │   │   ├── groups/
│   │   │   │   ├── group.model.ts
│   │   │   │   ├── groupParticipants.model.ts
│   │   │   │   └── groupPermissions.model.ts
│   │   │   ├── simlets/          # Study/experiment models
│   │   │   │   ├── simlet.model.ts
│   │   │   │   ├── simletGroups.model.ts
│   │   │   │   ├── simletPermissions.model.ts
│   │   │   │   ├── simletShlinks.model.ts
│   │   │   │   └── simletTags.model.ts
│   │   │   ├── sessions/         # Session models
│   │   │   │   ├── session.model.ts
│   │   │   │   ├── sessionPermissions.model.ts
│   │   │   │   └── sessionTags.model.ts
│   │   │   ├── activities/       # Activity-related models
│   │   │   │   ├── activity.model.ts
│   │   │   │   ├── activityCompletion.model.ts
│   │   │   │   ├── gameplayActivity.model.ts
│   │   │   │   ├── limesurveyActivity.model.ts
│   │   │   │   └── manualActivity.model.ts
│   │   │   ├── allocators/       # Participant allocation models
│   │   │   │   ├── allocator.model.ts
│   │   │   │   ├── experimentalParticipants.model.ts
│   │   │   │   └── randomAllocators.model.ts
│   │   │   ├── templates/        # Activity template models
│   │   │   │   ├── activityTemplate.model.ts
│   │   │   │   ├── activityTemplatePermissions.model.ts
│   │   │   │   ├── gameplayActivitiesTemplate.model.ts
│   │   │   │   ├── limesurveyActivitiesTemplate.model.ts
│   │   │   │   └── manualTemplateActivity.model.ts
│   │   │   └── tags/             # Tagging system models
│   │   │       ├── categoryList.model.ts
│   │   │       ├── sessionTagsList.model.ts
│   │   │       ├── simletTagsList.model.ts
│   │   │       └── subjectAreaList.model.ts
│   │   └── views/                # Database view queries
│   │       ├── index.ts
│   │       ├── v_complete_activities.queries.ts
│   │       ├── v_complete_sessions.queries.ts
│   │       ├── v_complete_simlets.queries.ts
│   │       └── v_groups.queries.ts
│   └── tests/                    # Comprehensive test suite
│       ├── __mocks__/
│       ├── controllers/
│       ├── libtests/
│       ├── routes/
│       ├── server/
│       ├── services/
│       └── views/
├── config/                       # Configuration files
├── coverage/                     # Test coverage reports
├── migrate/                      # Database migration scripts
├── public/                       # Static files
├── test/                         # Legacy test structure
├── api.yaml                      # OpenAPI 3.0 specification (2995 lines)
├── openapi.json                  # Generated OpenAPI JSON
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.jest.json            # Jest-specific TypeScript configuration
├── jest.config.cjs               # Jest testing configuration
├── updateOpenAPI.ts              # OpenAPI specification generator
├── updateQueryDocs.ts            # Query documentation generator
├── QUERY_DOCS.md                 # Auto-generated query documentation
└── README.md                     # Project documentation
```

## API Endpoints

### Authentication
Most endpoints require JWT authentication via Keycloak integration. Role-based access control supports: admins, teachers, students, noroles, lrsmanagers.

### Core Endpoints (62+ total)

#### Health & System
- **GET /health** - System health check
- **GET /events** - Server-sent events stream
- **POST /limesurvey-completion-webhooks** - LimeSurvey webhook integration

#### User Management
- **GET /users** - Get all users (with search, pagination)
- **POST /users** - Create new user
- **PUT /users/{id}** - Update user
- **PATCH /users/{id}** - Partial user update
- **POST /users/login** - User authentication
- **GET /users/me** - Get current user profile
- **GET /users/islimesurveyadmin** - Check LimeSurvey admin status
- **POST /users/link** - Link secondary account to main account
- **POST /users/events** - SSO event handling for user synchronization

#### Group Management
- **GET /groups** - Get groups list
- **POST /groups** - Create new group
- **GET /groups/{id}** - Get group by ID
- **PUT /groups/{id}** - Update group
- **DELETE /groups/{id}** - Delete group
- **GET /groups/{id}/studies** - Get assigned studies for group
- **GET /groups/{id}/participants** - Get group participants

#### Studies (Simlets) Management
- **GET /studies** - Get studies list
- **POST /studies** - Create new study
- **POST /studies/import** - Import study from file
- **GET /studies/{studyid}** - Get study by ID
- **PUT /studies/{studyid}** - Update study
- **GET /studies/{studyid}/export** - Export study data
- **GET /studies/{studyid}/events** - Get study events
- **GET /studies/{studyid}/events/getPresignedUrl** - Get presigned URL for events
- **GET /studies/{studyid}/schedule** - Get study schedule
- **GET /studies/{studyid}/schedule/events** - Get schedule events
- **GET /studies/{studyid}/groups** - Get study groups
- **GET /studies/{studyid}/tests** - Get study tests/sessions
- **POST /studies/{studyid}/tests** - Create study test/session
- **GET /studies/{studyid}/participants** - Get study participants
- **GET /studies/{studyid}/tests/{testid}** - Get specific test/session
- **PUT /studies/{studyid}/tests/{testid}** - Update test/session
- **DELETE /studies/{studyid}/tests/{testid}** - Delete test/session
- **GET /studies/{studyid}/tests/{testid}/activities** - Get test activities
- **POST /studies/{studyid}/tests/{testid}/activities** - Create test activity
- **GET /studies/{studyid}/allocator** - Get study allocator
- **POST /studies/{studyid}/allocator** - Create study allocator

#### Activities Management
- **GET /activities** - Get activities list
- **POST /activities** - Create activity
- **GET /activities/{id}** - Get activity by ID
- **PUT /activities/{id}** - Update activity
- **DELETE /activities/{id}** - Delete activity
- **GET /activities/{id}/export** - Export activity data
- **GET /activities/{id}/surveyowner** - Get survey owner
- **GET /activities/{id}/surveylanguages** - Get survey languages
- **GET /activities/{id}/usersurveylist** - Get user survey list
- **GET /activities/{id}/openable** - Check if activity is openable
- **POST /activities/{id}/open** - Open activity for user
- **GET /activities/{id}/target** - Get activity target URL
- **GET /activities/{id}/progress** - Get activity progress
- **POST /activities/{id}/suspend** - Suspend activity
- **POST /activities/{id}/completion** - Mark activity as completed
- **POST /activities/{id}/multicompletion** - Handle multiple completion events
- **POST /activities/{id}/result** - Set activity result
- **GET /activities/{id}/result** - Get activity result
- **GET /activities/{id}/hasresult** - Check if activity has result
- **GET /activities/{id}/test** - Get activity test data
- **GET /activities/{id}/presignedurl** - Get presigned URL for activity

#### xAPI Statements & Learning Analytics
- **GET /activities/{id}/statements** - Get xAPI statements
- **POST /activities/{id}/statements** - Post xAPI statements
- **GET /activities/{id}/agents** - Get activity agents
- **POST /activities/{id}/agents** - Create activity agent
- **GET /activities/{id}/agents/profile** - Get agent profile
- **POST /activities/{id}/agents/profile** - Update agent profile
- **GET /activities/{id}/activities** - Get sub-activities
- **POST /activities/{id}/activities** - Create sub-activity
- **GET /activities/{id}/activities/profile** - Get activities profile
- **POST /activities/{id}/activities/profile** - Update activities profile
- **GET /activities/{id}/activities/state** - Get activities state
- **PUT /activities/{id}/activities/state** - Update activities state
- **GET /activities/{id}/about** - Get activity information
- **GET /activities/{id}/extensions/{extensionId}** - Get activity extension

#### LTI (Learning Tools Interoperability)
- **POST /lti** - LTI launch endpoint
- **POST /lti/claims** - LTI claims processing
- **GET /lti/context/{id}/lineitems/** - Get line items
- **POST /lti/context/{id}/lineitems/** - Create line item
- **GET /lti/context/{id}/lineitems/{lineitem}/** - Get specific line item
- **PUT /lti/context/{id}/lineitems/{lineitem}/** - Update line item
- **DELETE /lti/context/{id}/lineitems/{lineitem}/** - Delete line item
- **GET /lti/context/{id}/lineitems/{lineitem}/results** - Get line item results
- **POST /lti/context/{id}/lineitems/{lineitem}/score** - Post score
- **GET /lti/context/{id}/memberships** - Get memberships
- **GET /lti/tools** - Get LTI tools
- **POST /lti/tools** - Create LTI tool
- **GET /lti/tools/{id}** - Get LTI tool by ID
- **PUT /lti/tools/{id}** - Update LTI tool
- **DELETE /lti/tools/{id}** - Delete LTI tool
- **GET /lti/platforms** - Get LTI platforms
- **POST /lti/platforms** - Create LTI platform
- **GET /lti/platforms/{id}** - Get LTI platform by ID
- **PUT /lti/platforms/{id}** - Update LTI platform
- **DELETE /lti/platforms/{id}** - Delete LTI platform

#### Metadata & Utilities
- **GET /activitytypes** - Get available activity types
- **GET /allocatortypes** - Get available allocator types
- **POST /tasklist** - Add item to task list
- **POST /uploads** - File upload endpoint

## Database Models

### Core Models

#### User
```typescript
{
  user_id: number (Primary Key, Auto-increment)
  username: string (Unique)
  email: string
  external_id: boolean
  real_name: string (Nullable)
  role: string
  createdAt: Date
  updatedAt: Date
}
```

#### Group
```typescript
{
  group_id: number (Primary Key, Auto-increment)
  name: string
  use_new_generation: boolean
  owner_id: number (Foreign Key → User)
  createdAt: Date
  updatedAt: Date
}
```

#### GroupParticipants (Composite Key)
```typescript
{
  group_id: number (Primary Key, Foreign Key → Group)
  user_id: number (Primary Key, Foreign Key → User)
}
```

#### GroupPermissions (Composite Key)
```typescript
{
  group_id: number (Primary Key, Foreign Key → Group)
  user_id: number (Primary Key, Foreign Key → User)
  permission: string (e.g., 'READ', 'WRITE')
}
```

#### Simlet (Study/Experiment)
```typescript
{
  simlet_id: number (Primary Key, Auto-increment)
  name: string
  description: string
  owner_id: number (Foreign Key → User)
  published: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Session (Test within Study)
```typescript
{
  session_id: number (Primary Key, Auto-increment)
  simlet_id: number (Foreign Key → Simlet)
  name: string
  description: string
  open_date: Date (Nullable)
  close_date: Date (Nullable)
  createdAt: Date
  updatedAt: Date
}
```

#### Activity
```typescript
{
  activity_id: number (Primary Key, Auto-increment)
  session_id: number (Foreign Key → Session)
  name: string
  description: string
  type: enum ('default', 'manual', 'limesurvey', 'gameplay', 'lti_tool')
  open_date: Date (Nullable)
  close_date: Date (Nullable)
  url: string (Nullable)
  extra_data: string (Nullable)
  copiedFrom: number (Nullable)
  createdAt: Date
  updatedAt: Date
}
```

#### ActivityCompletion
```typescript
{
  activity_id: number (Primary Key, Foreign Key → Activity)
  user_id: number (Primary Key, Foreign Key → User)
  completion_date: Date
  result: string (Nullable)
}
```

### Specialized Activity Models

#### GameplayActivity
```typescript
{
  activity_id: number (Primary Key, Foreign Key → Activity)
  gameplay_id: string
  analytics_backend: string
  a2_config: string
}
```

#### LimesurveyActivity
```typescript
{
  activity_id: number (Primary Key, Foreign Key → Activity)
  survey_id: number
  survey_name: string
  survey_password: string (Nullable)
  limesurvey_host: string
}
```

#### ManualActivity
```typescript
{
  activity_id: number (Primary Key, Foreign Key → Activity)
  instructions: string
}
```

### Allocation Models

#### Allocator
```typescript
{
  allocator_id: number (Primary Key, Auto-increment)
  simlet_id: number (Foreign Key → Simlet)
  name: string
  type: string
  config: string
}
```

#### RandomAllocators
```typescript
{
  allocator_id: number (Primary Key, Foreign Key → Allocator)
  group_percentages: string
}
```

#### ExperimentalParticipants
```typescript
{
  allocator_id: number (Primary Key, Foreign Key → Allocator)
  user_id: number (Primary Key, Foreign Key → User)
  allocated_group: string
}
```

### Template Models

#### ActivityTemplate
```typescript
{
  template_id: number (Primary Key, Auto-increment)
  name: string
  description: string
  type: string
  copiedFrom: number (Nullable)
  owner_id: number (Foreign Key → User)
}
```

### Tagging System Models

#### SimletTagsList
```typescript
{
  tag_id: number (Primary Key, Auto-increment)
  name: string
  category: string
  subject_area: string
}
```

#### SessionTagsList
```typescript
{
  tag_id: number (Primary Key, Auto-increment)
  name: string
  category: string
}
```

## Database Views

### Complex Query Views

#### v_complete_simlets
- Aggregated view of studies with all related data (participants, sessions, activities)
- Used for comprehensive study reporting and analytics

#### v_complete_sessions
- Aggregated view of sessions with activity completion data
- Used for session progress tracking and reporting

#### v_complete_activities
- Aggregated view of activities with completion and result data
- Used for activity progress monitoring and analytics

#### v_groups
- Group-related queries with permission and participant data
- Used for group management and access control

## Technology Stack

- **Framework**: Express.js 5.2.1 with TypeScript
- **Database**: SQLite with Sequelize ORM 6.35.0
- **Authentication**: JWT with Keycloak OAuth integration
- **Logging**: Pino 10.1.0 for structured logging
- **Testing**: Jest with Supertest for API testing
- **Documentation**: TypeDoc for API documentation generation, auto-generated query docs
- **Learning Analytics**: xAPI statement support
- **LTI Integration**: Full LTI 1.3 compliance
- **Real-time**: Server-Sent Events for live updates
- **Build System**: TypeScript compilation with multiple configurations (main, Jest)

## Key Features

1. **Educational Research Platform**: Complete solution for managing learning studies and experiments
2. **Multi-Activity Support**: Support for manual activities, LimeSurvey integration, gameplay analytics, and LTI tools
3. **xAPI Learning Analytics**: Full xAPI statement tracking and learning record store capabilities
4. **LTI 1.3 Compliance**: Integration with educational platforms via Learning Tools Interoperability
5. **Participant Allocation**: Random and experimental participant allocation algorithms
6. **Role-Based Security**: Comprehensive permission system with multiple user roles
7. **Real-time Updates**: Server-sent events for live study monitoring
8. **Template System**: Reusable activity templates for efficient study creation
9. **Advanced Analytics**: Complex database views for study progress and completion tracking
10. **OAuth Integration**: Keycloak authentication with SSO support
11. **Study Import/Export**: Complete study data portability
12. **Webhook Integration**: LimeSurvey completion webhook support
13. **File Upload**: Presigned URL support for secure file handling
14. **Comprehensive API**: 62+ endpoints covering all educational research workflows
15. **Object-Relational Mapping**: Dedicated mapper layer for complex data transformations
16. **Modular Architecture**: Entity-based organization for maintainability and scalability
17. **Type Metadata Management**: Dynamic activity and allocator type registration system

## Architecture Patterns

- **Layered Architecture**: Routes → Controllers → Services → Models pattern
- **Factory Pattern**: Model initialization with factory functions
- **Singleton Pattern**: Database and logger instances
- **Service Layer Pattern**: Business logic separation from controllers
- **Repository Pattern**: Database abstraction through Sequelize models
- **Mapper Pattern**: Object-relational mapping layer for complex data transformations
- **Middleware Chain**: Authentication, error handling, and validation layers
- **View Pattern**: Complex query optimization through database views
- **Event-Driven**: Real-time updates via Server-Sent Events
- **Template Method**: Activity creation through template inheritance
- **Module Organization**: Entity-based directory structure for scalability

## Development Standards

- **Comprehensive JSDoc**: Full documentation for all functions and classes
- **TypeScript Strict Mode**: Complete type safety throughout the codebase
- **Error Handling**: Centralized error management with typed error classes
- **Test Coverage**: Extensive Jest test suite with high coverage requirements
- **OpenAPI Compliance**: Full OpenAPI 3.0 specification with 2995 lines
- **Code Organization**: Clear separation of concerns and modular architecture
- **RESTful Design**: Consistent REST API patterns and HTTP semantics
- **Security Best Practices**: JWT authentication, role-based access, input validation