#!/bin/bash
# Install dctx CLI

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

# Determine install location
if [ -d "$HOME/.local/bin" ]; then
    INSTALL_DIR="$HOME/.local/bin"
elif [ -d "/usr/local/bin" ]; then
    INSTALL_DIR="/usr/local/bin"
else
    mkdir -p "$HOME/.local/bin"
    INSTALL_DIR="$HOME/.local/bin"
fi

# Copy script
cp dctx "$INSTALL_DIR/dctx"
chmod +x "$INSTALL_DIR/dctx"

echo -e "${GREEN}✓ Installed dctx to $INSTALL_DIR/dctx${NC}"
echo ""

# Check if in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "Add this to your ~/.zshrc or ~/.bashrc:"
    echo ""
    echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
    echo ""
fi

echo "Usage:"
echo "  cd your-project"
echo "  dctx init"
echo "  dctx track \"my first feature\""
echo "  dctx prompt | pbcopy   # copy context for any AI"
