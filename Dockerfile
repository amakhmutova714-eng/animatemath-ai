FROM manimcommunity/manim:v0.19.2

USER root

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p renders media tmp && chmod -R 777 renders media tmp

EXPOSE 3030

CMD ["node", "server.js"]
