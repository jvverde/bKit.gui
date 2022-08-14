FROM node:14.20

WORKDIR /app
COPY . .

#With help of https://trigodev.com/blog/develop-electron-in-docker

RUN apt update && apt install \
    libsecret-1-dev \
    git libx11-xcb1 libxcb-dri3-0 libxtst6 libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2 \
    -yq --no-install-suggests --no-install-recommends \
    libdrm2 libgbm1 \
    rsync sudo netcat \
    dbus dbus-x11 dbus-tests gnome-keyring xterm
    # && apt-get clean && rm -rf /var/lib/apt/lists/*


RUN npm install -g @quasar/cli
RUN npm install -g node-gyp

RUN adduser --disabled-password --gecos '' docker
RUN adduser docker sudo
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN chown -R docker /app
USER docker
RUN npm install

USER root
RUN chown root /app/node_modules/electron/dist/chrome-sandbox
RUN chmod 4755 /app/node_modules/electron/dist/chrome-sandbox

USER docker

CMD bash ./key-tar-workaround.sh