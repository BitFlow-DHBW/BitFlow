# --- Build Stage ---
FROM node:20-bullseye AS build
WORKDIR /app

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend/ .
RUN npm run build

# --- Serve Stage ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*
COPY --from=build /app/dist ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
