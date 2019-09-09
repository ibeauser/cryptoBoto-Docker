#!/bin/bash

#This script dumps the cryptoBoto database before stopping the Docker instance
set -ev

if [ -e db/pg_dump/cryptoboto.sql ]
then
	mv -f db/pg_dump/cryptoboto.sql db/pg_dump/cryptoboto-old.sql
fi
docker exec cryptoboto-docker_db_1 pg_dump -vw -U postgres -f pg_dump/cryptoboto.sql cryptoboto
docker-compose down