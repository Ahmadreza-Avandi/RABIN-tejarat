#!/bin/bash

# Replace environment variables in Nginx configuration template
envsubst '$DOMAIN_NAME' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the CMD from the Dockerfile
exec "$@"