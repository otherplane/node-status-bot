FROM nikolaik/python-nodejs:python3.9-nodejs14

ENV PYTHONUNBUFFERED=1

# Update apt, first
RUN ["apt", "update"]

COPY / /usr/src/app
WORKDIR /usr/src/app

# Install dependencies
RUN ["pip", "install", "-r", "requirements.txt"]

# Set the entrypoint
ENTRYPOINT ["python", "node_status_bot.py"]
