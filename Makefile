.PHONY: up down logs build shell-server shell-client install

# Start the application
up:
	docker-compose up -d

# Stop the application
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Rebuild containers
build:
	docker-compose build

# Access server shell
shell-server:
	docker exec -it ledger_server sh

# Access client shell
shell-client:
	docker exec -it ledger_client sh

# Clean install (optional helper if running locally without docker)
install:
	cd server && npm install
	cd client && npm install
