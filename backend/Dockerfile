FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --include=dev --ignore-scripts
COPY . .
EXPOSE 8080
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start"]
