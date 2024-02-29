#!/bin/sh

echo "$MOSQUITTO_USER:$MOSQUITTO_PASSWD" > /mosquitto/config/password.txt
mosquitto_passwd -U /mosquitto/config/password.txt

exec /docker-entrypoint.sh "$@"
