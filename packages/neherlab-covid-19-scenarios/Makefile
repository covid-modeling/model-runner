include .env
export

.PHONY: all
all: test integration-test release

.PHONY: clean
clean:
	rm -rf .local data dist

.PHONY: bootstrap
bootstrap:
	script/bootstrap
	lerna bootstrap

.PHONY: format
format:
	npm run fix

.PHONY: build
build: format
	lerna bootstrap
	npm run build

.PHONY: test
test: build
	npm run test

.PHONY: integration-test
integration-test: build
	npm run integration-test

.PHONY: release
release:
	docker-compose build run-model

.PHONY: run-local
run-local: build
	mkdir -p log input
	cp test/test-job.json input/inputFile.json
	./bin/run-model

.PHONY: export-regions
export-regions:
	ts-node script/export-region-yaml.ts
