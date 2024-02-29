FROM eclipse-mosquitto:latest
COPY ./entrypoint-custom.sh /entrypoint-custom.sh
ENTRYPOINT ["/entrypoint-custom.sh"]
CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/config/mosquitto.conf"]
