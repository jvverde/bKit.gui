$myip=(Test-Connection $env:COMPUTERNAME -Count 1).IPV4Address.IPAddressToString

docker run --privileged -e DISPLAY="$myip":0.0 `
  -v ${pwd}/src-electron:/app/src-electron `
  -v ${pwd}/src:/app/src `
  -v ${pwd}/bkit-client:/app/bkit-client `
  -it --rm bkit-gui-image #quasar dev -m electron --modern