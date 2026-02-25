FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Ensure Prisma client is generated inside the container
RUN npx prisma generate --schema prisma/schema.prisma

EXPOSE 3000
CMD ["npm", "run", "dev"]
