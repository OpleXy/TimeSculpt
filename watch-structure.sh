#!/bin/bash

# Parse arguments to collect -src values
SRC_FILES=()
while [[ $# -gt 0 ]]; do
  case $1 in
    -src)
      shift
      SRC_FILES+=("$1")
      ;;
    *)
      echo "Unknown argument: $1"
      ;;
  esac
  shift
done

while true; do
  {
    echo "This is the current filestructure of TimeSculpt, react vite@latest:"
    echo
    ls -a
    echo
    tree public src
    echo
    echo "Line Counts Per File:"
    find src public -type f -exec wc -l {} \; | sort -nr
    echo

    # Append contents of specified source files
    for file in "${SRC_FILES[@]}"; do
      if [[ -f "$file" ]]; then
        echo "----- Contents of: $file -----"
        cat "$file"
        echo
      else
        echo "----- File not found: $file -----"
      fi
    done
  } > structure_full.txt

  echo "structure_full.txt updated: $(date)"
  sleep 20
done
