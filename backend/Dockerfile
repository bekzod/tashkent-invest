FROM oven/bun:1.3.14
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 8080
CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun run start"]

