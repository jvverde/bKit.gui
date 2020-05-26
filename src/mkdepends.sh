#!/usr/bin/env bash
declare -r sdir="$(dirname -- "$(readlink -ne -- "$0")")"
grep -RPoh '\.\/.+?\.sh' . |sort -u > "$sdir/statics/depends.lst"
