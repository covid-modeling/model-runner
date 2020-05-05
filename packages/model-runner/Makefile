include .env
export

.PHONY: all
all: test integration-test release

.PHONY: clean
clean:
	rm -rf .local data dist

.PHONY: bootstrap
bootstrap:
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
	rm -rf input log output export.zip
	mkdir -p log input output
	cp test/test-job.json input/inputFile.json
	./bin/run-model test/test-job.json

.PHONY: run-remote
run-remote:
	./bin/submit-run ~/.github/covid_pat.json test/test-job-mrc-ide-covidsim.json
	./bin/submit-run ~/.github/covid_pat.json test/test-job-basel.json
	./bin/submit-run ~/.github/covid_pat.json test/test-job-mc19.json
