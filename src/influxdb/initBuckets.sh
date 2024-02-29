#!/bin/sh

set -e
influx bucket create -n sis -o AP -r 0d
