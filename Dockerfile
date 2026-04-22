# Build faza
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve faza
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Dodajemo konfiguraciju za React Router da ne baca 404 na refresh
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]