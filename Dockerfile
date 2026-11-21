FROM public.ecr.aws/docker/library/node:20-slim
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN npm install -g npm@10
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 3000
HEALTHCHECK CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode==200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]