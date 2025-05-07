#!/bin/bash

# Check if the JSON file path is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <path_to_json_file>"
    exit 1
fi

JSON_FILE=$1

# Check if the file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "Error: File $JSON_FILE does not exist."
    exit 1
fi

# Make sure the raw_json directory exists
mkdir -p raw_json

# Copy the JSON file to the raw_json directory
echo "Copying JSON file to raw_json directory..."
cp "$JSON_FILE" raw_json/dao_data.json

# Copy the file to the backend container
echo "Copying JSON file to backend container..."
docker cp raw_json/dao_data.json dao-portal-backend:/data/dao_data.json

# Run the import script in the container
echo "Running import script..."
docker exec -it dao-portal-backend python import_dao_data.py /data/dao_data.json

echo "Import completed successfully!"
echo "You can now access the enhanced DAO metrics at:"
echo "http://localhost:3000/dao/1 (replace '1' with the actual DAO ID)"