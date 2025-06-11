# Use the official nginx image as a parent image
FROM nginx:alpine

# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from the local project to the working directory
COPY ./index.html .
COPY ./css ./css
COPY ./js ./js
COPY ./images ./images

# Expose port 80
EXPOSE 80

# Configure nginx to serve the website
# Using the default nginx configuration which serves content from /usr/share/nginx/html

# Start nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
