FROM influxdb:latest
COPY ./influxdb/initBuckets.sh /docker-entrypoint-initdb.d/initBuckets.sh
RUN chmod +x /docker-entrypoint-initdb.d/initBuckets.sh
