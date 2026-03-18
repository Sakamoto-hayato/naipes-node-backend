# Naipes Negros - Backend API

🎮 Real-time multiplayer card game backend built with Node.js, TypeScript, Socket.IO, and Prisma.

## 🚀 Features

- ✅ **Real-time WebSocket** communication for multiplayer gaming
- ✅ **RESTful API** for user management, authentication, and game data
- ✅ **JWT Authentication** with refresh tokens
- ✅ **Prisma ORM** for type-safe database operations
- ✅ **Redis caching** for game state and session management
- ✅ **TypeScript** for type safety and better developer experience
- ✅ **Socket.IO** for bi-directional real-time communication
- ✅ **Scalable architecture** supporting 1000+ concurrent players

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL 8.0
- Redis 7.x
- Git

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd naipes-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` file with your database credentials and configuration:

```env
DATABASE_URL="mysql://user:password@localhost:3306/naipes"
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
```

### 4. Set up the database

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database with initial data
npm run prisma:seed
```

### 5. Start the development server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
naipes-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding
├── src/
│   ├── config/                # Configuration files
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication
│   │   ├── user/              # User management
│   │   ├── game/              # Game logic & WebSocket
│   │   ├── tournament/        # Tournament system
│   │   ├── coin/              # Virtual currency
│   │   ├── ranking/           # Leaderboards
│   │   └── upload/            # File uploads
│   ├── shared/                # Shared utilities
│   │   ├── middleware/        # Express middleware
│   │   ├── utils/             # Helper functions
│   │   ├── decorators/        # TypeScript decorators
│   │   └── guards/            # Authorization guards
│   ├── types/                 # TypeScript type definitions
│   ├── app.ts                 # Express application
│   └── server.ts              # Server entry point
├── tests/                     # Test files
├── uploads/                   # User uploaded files
├── logs/                      # Application logs
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |
| `npm test` | Run tests |
| `npm run lint` | Check code quality |
| `npm run format` | Format code with Prettier |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Example Request

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "player1",
    "coins": 1000
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## 🎮 WebSocket Events

Connect to WebSocket server at `ws://localhost:3000`

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-game` | `{ gameId: string }` | Join a game room |
| `play-card` | `{ gameId: string, cardId: string }` | Play a card |
| `challenge` | `{ gameId: string, type: string }` | Make a challenge (Truco/Envido) |
| `respond-challenge` | `{ gameId: string, accept: boolean }` | Respond to challenge |
| `send-message` | `{ gameId: string, text: string }` | Send chat message |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `game-state` | `{ ...gameState }` | Full game state |
| `game-update` | `{ ...gameState }` | Game state update |
| `game-finished` | `{ winner: string, ... }` | Game ended |
| `challenge-made` | `{ type: string, ... }` | Challenge received |
| `message` | `{ userId: string, text: string }` | Chat message |
| `error` | `{ message: string }` | Error occurred |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run load tests
npm run load-test
```

## 🚢 Deployment

### Using Docker

```bash
docker build -t naipes-backend .
docker run -p 3000:3000 --env-file .env naipes-backend
```

### Using PM2

```bash
npm run build
pm2 start dist/server.js --name naipes-backend
```

## 📊 Database Schema

The application uses MySQL with the following main entities:

- **User** - Player accounts and statistics
- **Game** - Active and completed games
- **Round** - Game rounds (best of 3)
- **Trick** - Individual card plays within rounds
- **Challenge** - Truco/Envido challenges
- **Tournament** - Tournament brackets and results
- **Transaction** - Coin transactions history
- **Message** - In-game chat messages

See `prisma/schema.prisma` for the complete schema.

## 🔧 Configuration

Key configuration options in `.env`:

- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - MySQL connection string
- `REDIS_HOST` - Redis server host
- `JWT_SECRET` - Secret key for JWT signing
- `DEFAULT_COINS` - Starting coins for new users
- `MIN_WITHDRAW_AMOUNT` - Minimum withdrawal amount

## 🐛 Debugging

Enable debug logs:

```bash
LOG_LEVEL=debug npm run dev
```

View logs:

```bash
tail -f logs/app-YYYY-MM-DD.log
```

## 📝 API Documentation

Full API documentation is available at `/api/docs` when the server is running (Swagger UI).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Hayato** - Initial work

## 🙏 Acknowledgments

- Truco game rules implementation
- Socket.IO for real-time communication
- Prisma for database management
- The Node.js community

## 📧 Support

For support, email support@naipesnegros.com or open an issue in the repository.

---

**Built with ❤️ for the Naipes Negros community**
