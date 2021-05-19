#!/usr/bin/env bash

invalid_themes=$(find . -maxdepth 1 -type d \
    ! -regex "./\..*" \
    ! -regex "\." \
    ! -regex "\./[A-Z][a-z0-9]*\(-?[A-Z][a-z0-9]*\)*")

if [[ ! -z "$invalid_themes" ]]; then
    echo "Invalid theme names: $invalid_themes"
    exit 1
fi
