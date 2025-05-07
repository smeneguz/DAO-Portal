#!/bin/bash

# Check if file path is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <path_to_json_file>"
    echo "Example: $0 /data/dao_data.json"
    exit 1
fi

JSON_FILE=$1

# Copy the JSON file to the container
echo "Copying JSON file to container..."
docker cp "$JSON_FILE" dao-portal-backend:/data/dao_data.json

# Run the import script
echo "Running import script..."
docker exec -it dao-portal-backend python import_dao_data.py /data/dao_data.json

echo "Import completed!"