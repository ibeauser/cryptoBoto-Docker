#!/bin/bash
set -e

psql --username postgres --dbname cryptoboto -f /pg_dump/cryptoboto.sql