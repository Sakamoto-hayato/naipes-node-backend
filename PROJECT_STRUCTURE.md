# Naipes Backend - Project Structure

## 📁 Directory Overview

```
naipes-backend/
├── 📄 Configuration Files
│   ├── .env.example              # Environment variables template
│   ├── .eslintrc.json            # ESLint configuration
│   ├── .gitattributes            # Git attributes
│   ├── .gitignore                # Git ignore rules
│   ├── .prettierrc               # Prettier code formatting
│   ├── package.json              # NPM dependencies and scripts
│   └── tsconfig.json             # TypeScript configuration
│
├── 📚 Documentation
│   ├── README.md                 # Main documentation
│   ├── CHANGELOG.md              # Version history
│   ├── GIT_SETUP.md              # Git initialization guide
│   ├── LICENSE                   # MIT License
│   └── PROJECT_STRUCTURE.md      # This file
│
├── 🗄️ Database (prisma/)
│   ├── schema.prisma             # Prisma database schema
│   ├── migrations/               # Database migration files (auto-generated)
│   └── seed.ts                   # Database seeding script (to be created)
│
├── 💻 Source Code (src/)
│   ├── server.ts                 # Application entry point
│   ├── app.ts                    # Express app configuration
│   │
│   ├── config/                   # Configuration modules
│   │   ├── database.ts           # Database connection
│   │   ├── redis.ts              # Redis configuration
│   │   └── logger.ts             # Winston logger setup
│   │
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── dto/              # Data Transfer Objects
│   │   │
│   │   ├── user/                 # User management
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   └── user.routes.ts
│   │   │
│   │   ├── game/                 # Game logic & WebSocket
│   │   │   ├── game.controller.ts
│   │   │   ├── game.service.ts
│   │   │   ├── game.gateway.ts   # Socket.IO WebSocket
│   │   │   ├── game.logic.ts     # Truco game rules
│   │   │   ├── game.room.ts      # Game room management
│   │   │   └── constants/
│   │   │       └── card-values.ts
│   │   │
│   │   ├── tournament/           # Tournament system
│   │   │   ├── tournament.controller.ts
│   │   │   ├── tournament.service.ts
│   │   │   └── tournament.routes.ts
│   │   │
│   │   ├── coin/                 # Virtual currency
│   │   │   ├── coin.controller.ts
│   │   │   ├── coin.service.ts
│   │   │   └── coin.routes.ts
│   │   │
│   │   ├── ranking/              # Leaderboards
│   │   │   ├── ranking.controller.ts
│   │   │   ├── ranking.service.ts
│   │   │   └── ranking.routes.ts
│   │   │
│   │   └── upload/               # File uploads
│   │       ├── upload.controller.ts
│   │       ├── upload.service.ts
│   │       └── upload.routes.ts
│   │
│   ├── shared/                   # Shared utilities
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   │
│   │   ├── utils/                # Helper functions
│   │   │   ├── crypto.ts
│   │   │   ├── logger.ts
│   │   │   ├── response.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── decorators/           # TypeScript decorators
│   │   └── guards/               # Authorization guards
│   │
│   └── types/                    # TypeScript type definitions
│       ├── express.d.ts          # Express type extensions
│       └── socket.d.ts           # Socket.IO type extensions
│
├── 🧪 Tests (tests/)
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── load/                     # Load tests (Artillery)
│       └── game.yml              # Load test scenarios
│
├── 📦 Build Output (dist/)       # Compiled JavaScript (generated)
├── 📝 Logs (logs/)               # Application logs
├── 📤 Uploads (uploads/)         # User uploaded files
└── 📦 Dependencies (node_modules/) # NPM packages (auto-installed)
```

## 🎯 Module Responsibilities

### Auth Module
- User registration
- Login/logout
- JWT token generation
- Refresh token handling
- Password reset

### User Module
- User profile management
- User statistics
- Profile picture uploads
- Account settings

### Game Module
- Game creation and joining
- Real-time card play via WebSocket
- Game state management
- Truco game rules implementation
- Challenge system (Truco, Retruco, Envido)
- Chat messaging

### Tournament Module
- Tournament creation
- Player registration
- Bracket generation
- Match scheduling
- Winner determination

### Coin Module
- Virtual currency management
- Transaction history
- Coin packages
- Withdrawal requests (admin approval)

### Ranking Module
- Global leaderboards
- User statistics
- Tournament rankings
- Position calculations

### Upload Module
- Profile picture uploads
- Image processing (Sharp)
- File validation
- CDN integration

## 🔄 Data Flow

```
Client Request
    ↓
Express Router
    ↓
Middleware (Auth, Validation)
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Repository / Prisma
    ↓
Database (MySQL)
```

## 🔌 WebSocket Flow

```
Client Connect
    ↓
Socket.IO Authentication
    ↓
Join Game Room
    ↓
Game Gateway
    ↓
Game Room Manager
    ↓
Game Logic / Redis
    ↓
Broadcast to All Players
```

## 📝 Naming Conventions

### Files
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Routes: `*.routes.ts`
- DTOs: `*.dto.ts`
- Tests: `*.spec.ts` or `*.test.ts`

### Classes
- PascalCase: `UserService`, `GameController`

### Functions/Methods
- camelCase: `getUserById()`, `createGame()`

### Constants
- UPPER_SNAKE_CASE: `DEFAULT_COINS`, `JWT_EXPIRES_IN`

### Interfaces/Types
- PascalCase with descriptive names: `IUser`, `GameState`, `JwtPayload`

## 🚀 Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/tournament-matching
   ```

2. **Develop**
   - Write code in `src/modules/`
   - Add tests in `tests/`
   - Update types if needed

3. **Test**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: Add tournament matching algorithm"
   ```

5. **Push & PR**
   ```bash
   git push origin feature/tournament-matching
   # Create Pull Request on GitHub
   ```

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| express | HTTP server framework |
| socket.io | WebSocket real-time communication |
| @prisma/client | Database ORM |
| ioredis | Redis client for caching |
| jsonwebtoken | JWT authentication |
| bcrypt | Password hashing |
| helmet | Security headers |
| cors | Cross-origin resource sharing |
| winston | Logging |
| multer | File uploads |
| sharp | Image processing |

## 🔐 Security Layers

1. **Helmet** - HTTP security headers
2. **CORS** - Controlled cross-origin access
3. **JWT** - Stateless authentication
4. **bcrypt** - Password hashing (12 rounds)
5. **Rate Limiting** - Prevent abuse
6. **Input Validation** - express-validator
7. **SQL Injection Prevention** - Prisma parameterized queries

## 🎨 Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for consistent formatting
- 2-space indentation
- Single quotes for strings
- Semicolons required
- 100 character line limit

## 📈 Scalability Features

- **Stateless API** - Horizontal scaling ready
- **Redis Caching** - Reduce database load
- **WebSocket Rooms** - Isolated game instances
- **Async/Non-blocking** - Handle 10,000+ connections
- **Connection Pooling** - Efficient database access
- **Load Testing** - Performance validation

## 🔄 Next Steps

1. ✅ Initialize Git repository
2. ✅ Create project structure
3. ✅ Set up Prisma schema
4. ⏳ Implement authentication module
5. ⏳ Build game logic engine
6. ⏳ Add WebSocket gateway
7. ⏳ Create tournament system
8. ⏳ Integrate Redis caching
9. ⏳ Write comprehensive tests
10. ⏳ Deploy to production

---

**Current Status**: Project scaffolding complete ✅
**Next Milestone**: Week 1 - Authentication & User Management
