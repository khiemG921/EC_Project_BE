FROM node:20-bookworm

# Install Chromium, Chromedriver, Python3 and runtime deps for headless Chrome
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium \
       chromium-driver \
       python3 \
       python3-pip \
       ca-certificates \
       fonts-liberation \
       libu2f-udev \
    && ln -sf /usr/bin/chromium /usr/bin/google-chrome \
    && rm -rf /var/lib/apt/lists/*

# Python packages required by the crawler script
RUN pip3 install --no-cache-dir \
      pandas \
      requests \
      beautifulsoup4 \
      selenium

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the backend source
COPY . .

ENV NODE_ENV=production
ENV PORT=5000
ENV CHROME_BIN=/usr/bin/google-chrome
ENV CHROMEDRIVER_BIN=/usr/bin/chromedriver

EXPOSE 5000

CMD ["node", "index.js"]
