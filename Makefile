node_modules:
	yarn

lib: node_modules
	node_modules/.bin/tsc --project tsconfig.types.json

.PHONY: test
test: lib
	yarn run test

.PHONY: clean
clean:
	-test -d dist/ && rm -rf dist/
	-test -d lib/ && rm -rf lib/

.PHONY: deps
.DEFAULT: deps
deps: lib
