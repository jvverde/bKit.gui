FROM node:14.20

WORKDIR /app
COPY . .

RUN npm install -g @quasar/cli
RUN npm install -g node-gyp

RUN apt update && apt install \
    libsecret-1-dev \
    git libx11-xcb1 libxcb-dri3-0 libxtst6 libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2 \
    -yq --no-install-suggests --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


RUN  npm install

#RUN chown -R node /app
CMD bash