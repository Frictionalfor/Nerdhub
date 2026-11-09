# Shared NerdHub configuration package.

#

# Provides canonical TypeScript, ESLint and Prettier configuration consumed by

# every app and package in the monorepo. Extend these rather than duplicating

# config values across projects.

#

# Usage (package.json):

# "devDependencies": { "@nerdhub/config": "workspace:*" }

#

# Usage (tsconfig.json):

# { "extends": "@nerdhub/config/tsconfig" }

#

# Usage (prettier):

# import config from "@nerdhub/config/prettier"
