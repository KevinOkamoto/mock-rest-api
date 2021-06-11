#!/bin/bash

PWD=$(pwd)
VOLUME="mongodata"
CONTAINER="dbstore"
DEFAULT_FILE="backup.tar"

FILE=$1

if [ -z "$FILE" ]; then
    FILE=$DEFAULT_FILE
fi

echo "Backing up volume ..."

# Executing backup of docker volume
docker run -v $VOLUME:/data --name $CONTAINER ubuntu /bin/bash
docker run --rm --volumes-from $CONTAINER -v $(pwd):/backup ubuntu tar cvf /backup/$DEFAULT_FILE /data

# Remove container
docker rm $CONTAINER

if [ "$FILE" != "$DEFAULT_FILE" ]; then
    mv $PWD/$DEFAULT_FILE $FILE
fi