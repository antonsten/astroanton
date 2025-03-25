#!/bin/bash

# Set the articles directory path
ARTICLES_DIR="src/content/articles"

# Function to convert a single file
convert_file() {
    local txt_file="$1"
    local mdx_file="${txt_file%.txt}.mdx"
    
    # Read the content of the txt file
    content=$(cat "$txt_file")
    
    # Extract title from the content (first line)
    title=$(echo "$content" | head -n 1)
    
    # Extract date from the content (second line)
    date=$(echo "$content" | sed -n '2p')
    
    # Create frontmatter
    frontmatter="---
title: \"$title\"
description: \"A blog post about $title\"
date: \"$date\"
readingTime: \"4 minutes\"
---"
    
    # Create the MDX content
    echo "$frontmatter" > "$mdx_file"
    echo "" >> "$mdx_file"
    echo "$content" | tail -n +3 >> "$mdx_file"
    
    # Delete the original txt file
    rm "$txt_file"
    
    echo "Converted $txt_file to $mdx_file"
}

# Find all .txt files and convert them
find "$ARTICLES_DIR" -type f -name "*.txt" | while read -r file; do
    convert_file "$file"
done 