#!/bin/bash
# update_dao_data.sh

# Help message
function show_help {
    echo "Usage: $0 <path_to_json_file>"
    echo "Example:"
    echo "  $0 /path/to/dao_data.json"
}

# Check if JSON file path is provided
if [ $# -eq 0 ]; then
    echo "ERROR: No JSON file path provided"
    show_help
    exit 1
fi

JSON_FILE=$1

# Check if the file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "ERROR: File $JSON_FILE does not exist"
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

# Create scripts directory if it doesn't exist
mkdir -p app/scripts
touch app/scripts/__init__.py

# Run the import script in the container
echo "Running import script..."
docker exec -it dao-portal-backend python -m app.scripts.import_dao_data /data/dao_data.json

# Check if the import was successful
if [ $? -eq 0 ]; then
    echo "Import completed successfully!"
    echo "You can now access the DAO data at: http://localhost:3000"
else
    echo "ERROR: Import failed"
    exit 1
fi