# 🧶 Yarn
The multipurpose open-source Discord Bot.

## How to run
1. Copy **.env.example** to **.env** and fill out the required authentication tokens
2. Repeat the following steps in each folder in the `packages` folder
    1. Run `npm install` or `yarn` to install dependencies
    2. Run `npm run build` and then `npm start` to start

## How to run (Docker)
For running in a development environment, use
```yaml
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

For running in a production environment, use
```yaml
docker-compose up
```