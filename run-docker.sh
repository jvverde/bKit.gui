docker run --privileged -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=unix$DISPLAY \
  -v "$(pwd)"/src-electron:/app/src-electron \
  -v "$(pwd)"/src:/app/src \
  -v "$(pwd)"/bkit-client:/app/bkit-client \
  -it --rm bkit-gui # quasar dev -m electron --modern