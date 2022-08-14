export NO_AT_BRIDGE=1; # Don't use dbus accessibility bridge
eval $(dbus-launch --sh-syntax);
eval $(echo -n "" | /usr/bin/gnome-keyring-daemon --login);
eval $(/usr/bin/gnome-keyring-daemon --components=secrets --start);
bash