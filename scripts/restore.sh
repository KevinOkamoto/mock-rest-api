#!/bin/bash

PWD=$(pwd)
VOLUME="mongodata"
CONTAINER="dbstore"
DEFAULT_FILE="backup.tar"

FILE=$1

if [ -z "$FILE" ]; then
    FILE=$DEFAULT_FILE
fi

# Check to see if file exists
if [ ! -f "$FILE" ]; then
    echo "Cannot find file: $FILE"
    exit 1
fi

if [ "$FILE" != "$DEFAULT_FILE" ]; then
    cp $FILE $PWD/$DEFAULT_FILE
fi


echo "Restoring volume from backup file ..."

# Executing restoration of docker volume
docker run -v $VOLUME:/data --name $CONTAINER ubuntu /bin/bash
docker run --rm --volumes-from $CONTAINER -v $(pwd):/backup ubuntu bash -c "cd /data && tar xvf /backup/$DEFAULT_FILE --strip 1"

# Remove container
docker rm $CONTAINER

# Remove temp file
if [ "$DEFAULT_FILE" != "$1" ]; then
	rm $PWD/$DEFAULT_FILE
fi
