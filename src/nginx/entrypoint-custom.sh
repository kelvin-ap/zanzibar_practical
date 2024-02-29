#!/bin/sh

echo -n "$API_USER":$(openssl passwd -apr1 "$API_PASSWD") >> /etc/nginx/.htpasswd

exec /docker-entrypoint.sh "$@"
