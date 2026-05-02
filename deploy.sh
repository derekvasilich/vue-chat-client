#!/bin/bash
set -e # Stop on any error

# 1. Configuration
FUNCTION_NAME="vue-chat-agent"
NODE_VERSION="18.18.1"
BUILD_DIR="dist"
BUCKET_NAME="chat-agent-142731142295-ca-central-1-an"

echo "🚀 Starting automated build for $FUNCTION_NAME..."

# 2. Cleanup previous builds
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# 4. Install dependencies
echo "📥 Installing dependencies..."
yarn --frozen-lockfile

# 5. Copy application code and other important deps
echo "📂 Building app code..."
yarn build

# 7. Update S3 Bucket
echo "☁️ Uploading to S3 Bucket..."
aws s3 sync $BUILD_DIR/example s3://$BUCKET_NAME --delete

echo "✅ Deployment complete!"
