#!/bin/bash

# Find all MDX files and replace <br> with <br />
find src/content/articles -name "*.mdx" -type f -exec sed -i '' 's/<br>/<br \/>/g' {} +

# Also replace double <br><br> with <br /><br />
find src/content/articles -name "*.mdx" -type f -exec sed -i '' 's/<br><br>/<br \/><br \/>/g' {} + 