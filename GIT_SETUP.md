# Git Setup Instructions

Due to Windows permission restrictions, please follow these steps to initialize Git manually:

## Option 1: Using Git Bash (Recommended)

1. Open **Git Bash** (run as Administrator if needed)
2. Navigate to the project directory:
   ```bash
   cd "d:/New folder/naipes-backend"
   ```
3. Initialize Git:
   ```bash
   git init
   ```
4. Add all files:
   ```bash
   git add .
   ```
5. Create initial commit:
   ```bash
   git commit -m "Initial commit: Node.js backend with TypeScript, Prisma, Socket.IO"
   ```

## Option 2: Using GitHub Desktop

1. Open **GitHub Desktop**
2. Click **File** → **Add Local Repository**
3. Browse to `D:\New folder\naipes-backend`
4. Click **Add Repository**
5. GitHub Desktop will detect it's not a Git repository and offer to create one
6. Click **create a repository** link
7. Uncheck "Initialize this repository with a README" (we already have one)
8. Click **Create Repository**

## Option 3: Using Command Prompt (Administrator)

1. Right-click **Command Prompt** → **Run as administrator**
2. Navigate to directory:
   ```cmd
   cd "d:\New folder\naipes-backend"
   ```
3. Initialize Git:
   ```cmd
   git init
   git add .
   git commit -m "Initial commit: Node.js backend with TypeScript, Prisma, Socket.IO"
   ```

## Adding Remote Repository (GitHub)

After initializing Git locally:

1. Create a new repository on GitHub (https://github.com/new)
   - Repository name: `naipes-backend`
   - Description: "Naipes Negros - Real-time multiplayer card game backend"
   - Keep it **Private** (or Public if preferred)
   - Do **NOT** initialize with README, .gitignore, or license (we have them)

2. Add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/naipes-backend.git
   git branch -M main
   git push -u origin main
   ```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Verifying Setup

After setup, verify with:

```bash
git status
git log --oneline
git remote -v
```

You should see:
- Clean working tree
- Initial commit in log
- Remote origin pointing to GitHub

## Commit Message Convention

Use this format for commits:

```
<type>: <subject>

<body>

Examples:
feat: Add user authentication module
fix: Resolve WebSocket reconnection issue
docs: Update API documentation
test: Add unit tests for game logic
refactor: Improve database query performance
```

## Next Steps

After Git is initialized and pushed to GitHub:

1. Share the repository URL with the client
2. Grant client read access to the repository
3. Set up branch protection rules (optional)
4. Configure GitHub Actions for CI/CD (optional)

---

**Note**: Once Git is initialized successfully, you can delete this file with:
```bash
git rm GIT_SETUP.md
git commit -m "docs: Remove Git setup instructions"
```
