.PHONY: dev setup test lint check

dev:
	npm run dev

setup:
	npm install
	cp -n .env.example .env.local || true

test:
	npm run test --if-present

lint:
	npm run lint && npx tsc --noEmit

check:
	@bash scripts/check-requirements.sh
