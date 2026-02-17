FROM node:20-alpine
WORKDIR /app

# Install pnpm and bun
RUN npm install -g pnpm
RUN npm install -g bun

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared

# Copy backend package and install
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY backend ./backend

EXPOSE 8000

CMD ["pnpm", "--filter", "backend", "start"]
