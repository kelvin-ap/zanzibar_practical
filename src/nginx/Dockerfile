FROM nginx

COPY ./entrypoint-custom.sh /entrypoint-custom.sh
RUN chmod +x /entrypoint-custom.sh
ENTRYPOINT ["/entrypoint-custom.sh"]
CMD ["nginx", "-g", "daemon off;"]

COPY nginx.conf /etc/nginx/conf.d/default.conf
