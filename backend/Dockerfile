FROM oven/bun:1
WORKDIR /app

# Copy package manifest first for dependency install caching
COPY package.json ./

# Install dependencies before copying source code (better layer caching)
RUN bun install --production

# Copy source code after dependencies are installed
COPY . ./

EXPOSE 8000

CMD ["bun", "run", "start"]
