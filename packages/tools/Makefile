
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

