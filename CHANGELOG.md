# Changelog

All notable changes to the Naipes Negros Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial project setup with Node.js, TypeScript, and Express
- Prisma ORM integration with MySQL database
- Complete database schema migration from Symfony/Doctrine
- JWT authentication with refresh token support
- WebSocket server using Socket.IO for real-time gameplay
- Redis caching for game state and session management
- User registration and authentication endpoints
- Game logic implementation (Truco rules)
- Tournament system architecture
- Virtual currency (coins) management
- File upload service for profile pictures
- Comprehensive API documentation
- Environment-based configuration
- Logging system with Winston
- ESLint and Prettier for code quality
- Git repository initialization

### Changed
- Migrated from PHP/Symfony to Node.js/TypeScript
- Replaced Mercure SSE with Socket.IO WebSocket
- Switched from Doctrine ORM to Prisma ORM

### Removed
- Facebook authentication (as per client request)
- MercadoPago payment integration (coins are now deck-exchange only)

### Security
- Implemented JWT-based authentication
- Added bcrypt password hashing
- CORS configuration for API security
- Environment variable protection for sensitive data
