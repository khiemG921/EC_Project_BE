FROM node:20-bookworm

# Install Chromium, Chromedriver, Python3 and runtime deps for headless Chrome
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium \
       chromium-driver \
       python3 \
       python3-venv \
       python3-pip \
       ca-certificates \
       fonts-liberation \
       libu2f-udev \
    && ln -sf /usr/bin/chromium /usr/bin/google-chrome \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment for Python packages to avoid "externally-managed-environment" errors
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/python -m pip install --upgrade pip setuptools wheel

# Install Python packages into the venv
RUN /opt/venv/bin/pip install --no-cache-dir \
      pandas \
      requests \
      beautifulsoup4 \
      selenium

# Put venv bin first in PATH so `python` and `pip` in runtime use the venv
ENV PATH="/opt/venv/bin:$PATH"

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
