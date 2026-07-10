.PHONY: help install setup dev build test clean deploy

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "📦 Installing backend dependencies..."
	npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Dependencies installed"

setup: install ## Run full setup (install + configure)
	@echo "🔧 Running setup..."
	chmod +x scripts/setup.sh
	./scripts/setup.sh
	@echo "✅ Setup complete"

dev-backend: ## Start backend in development mode
	@echo "🚀 Starting backend..."
	npm run dev

dev-frontend: ## Start frontend in development mode
	@echo "🚀 Starting frontend..."
	cd frontend && npm run dev

dev: ## Start both backend and frontend (requires tmux or separate terminals)
	@echo "🚀 Starting development servers..."
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@echo "Run in separate terminals:"
	@echo "  Terminal 1: make dev-backend"
	@echo "  Terminal 2: make dev-frontend"

build-backend: ## Build backend
	@echo "🔨 Building backend..."
	npm run build
	@echo "✅ Backend built"

build-frontend: ## Build frontend
	@echo "🔨 Building frontend..."
	cd frontend && npm run build
	@echo "✅ Frontend built"

build: build-backend build-frontend ## Build both backend and frontend

test: ## Run all tests
	@echo "🧪 Running tests..."
	npm test
	@echo "✅ Tests complete"

test-coverage: ## Run tests with coverage
	@echo "🧪 Running tests with coverage..."
	npm run test:coverage
	@echo "✅ Coverage report generated"

lint: ## Run linters
	@echo "🔍 Linting backend..."
	npm run lint
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint
	@echo "✅ Linting complete"

type-check: ## Run TypeScript type checking
	@echo "🔍 Type checking backend..."
	npm run type-check
	@echo "🔍 Type checking frontend..."
	cd frontend && npm run type-check
	@echo "✅ Type checking complete"

clean: ## Clean build artifacts and node_modules
	@echo "🧹 Cleaning..."
	rm -rf node_modules dist
	rm -rf frontend/node_modules frontend/dist
	@echo "✅ Cleaned"

firebase-deploy-rules: ## Deploy Firestore rules
	@echo "🔥 Deploying Firestore rules..."
	firebase deploy --only firestore:rules
	@echo "✅ Rules deployed"

firebase-deploy-indexes: ## Deploy Firestore indexes
	@echo "🔥 Deploying Firestore indexes..."
	firebase deploy --only firestore:indexes
	@echo "✅ Indexes deployed"

firebase-deploy: firebase-deploy-rules firebase-deploy-indexes ## Deploy Firestore rules and indexes

init-firestore: ## Initialize Firestore with sample data
	@echo "🔥 Initializing Firestore..."
	node scripts/init-firestore.js
	@echo "✅ Firestore initialized"

generate-key: ## Generate encryption key
	@echo "🔐 Generating encryption key..."
	node scripts/generate-encryption-key.js

start-backend: build-backend ## Start backend in production mode
	@echo "🚀 Starting backend (production)..."
	npm start

deploy-backend: ## Deploy backend to Cloud Run
	@echo "☁️ Deploying backend to Cloud Run..."
	gcloud builds submit --tag gcr.io/${PROJECT_ID}/google-integration-api
	gcloud run deploy google-integration-api --image gcr.io/${PROJECT_ID}/google-integration-api
	@echo "✅ Backend deployed"

deploy-frontend: build-frontend ## Deploy frontend to Vercel
	@echo "☁️ Deploying frontend to Vercel..."
	cd frontend && vercel --prod
	@echo "✅ Frontend deployed"

deploy: deploy-backend deploy-frontend ## Deploy both backend and frontend

health-check: ## Check backend health
	@curl http://localhost:3000/health || echo "Backend not running"

redis-start: ## Start Redis (Docker)
	@echo "🔴 Starting Redis..."
	docker run -d --name redis -p 6379:6379 redis:7-alpine
	@echo "✅ Redis started"

redis-stop: ## Stop Redis
	@echo "🔴 Stopping Redis..."
	docker stop redis
	docker rm redis
	@echo "✅ Redis stopped"

redis-ping: ## Test Redis connection
	@redis-cli ping

logs-backend: ## View backend logs
	@tail -f logs/backend.log

logs-frontend: ## View frontend logs
	@tail -f logs/frontend.log

docs: ## Open documentation
	@echo "📚 Documentation files:"
	@echo "  README.md"
	@echo "  QUICK_START.md"
	@echo "  DEPLOYMENT_GUIDE.md"
	@echo "  FINAL_CHECKLIST.md"

.DEFAULT_GOAL := help
