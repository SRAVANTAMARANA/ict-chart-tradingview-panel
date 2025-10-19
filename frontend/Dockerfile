FROM nginx:stable-alpine
ARG CACHEBUST=1

# Clean default html
RUN rm -rf /usr/share/nginx/html/*

# Copy app static files
COPY . /usr/share/nginx/html

# Use our nginx.conf to proxy /api to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bust cache when needed
RUN touch /usr/share/nginx/html/.cachebust-${CACHEBUST}

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
