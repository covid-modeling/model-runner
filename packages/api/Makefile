.PHONY: all
all: build

.PHONY: clean
clean:
	rm -rf dist

.PHONY: bootstrap
bootstrap:
	lerna bootstrap

.PHONY: format
format:
	npm run fix

.PHONY: build
build: bootstrap format
	npm run build
