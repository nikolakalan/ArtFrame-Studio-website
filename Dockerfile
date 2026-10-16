FROM nginx:stable-alpine

COPY ["ArtFrame Studio website/", "/usr/share/nginx/html/"]

RUN cp /usr/share/nginx/html/indexglaven.html /usr/share/nginx/html/index.html

EXPOSE 80
