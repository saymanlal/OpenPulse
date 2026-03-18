#!/bin/bash

# Phase 12 Installation Script
# Adds Cyber Intelligence Support to Phase 11

echo "📦 Installing Phase 12 - Cyber Intelligence..."
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Run this script from the openpulse-phase12 directory"
    exit 1
fi

# Ask for destination
read -p "Enter your openpulse project path (default: ~/openpulse): " DEST_PATH
DEST_PATH=${DEST_PATH:-~/openpulse}
DEST_PATH="${DEST_PATH/#\~/$HOME}"

if [ ! -d "$DEST_PATH" ]; then
    echo "❌ Error: Directory $DEST_PATH does not exist"
    exit 1
fi

echo ""
echo "Installing to: $DEST_PATH"
echo ""

# Create types directory if it doesn't exist
mkdir -p "$DEST_PATH/frontend/types"

# Copy Phase 12 files
echo "📄 Installing Phase 12 files..."
cp -v frontend/types/cyber.ts "$DEST_PATH/frontend/types/"
cp -v frontend/lib/cyberIntelligence.ts "$DEST_PATH/frontend/lib/"
cp -v frontend/lib/cyberSampleData.ts "$DEST_PATH/frontend/lib/"
cp -v frontend/hooks/useCyberIntelligence.ts "$DEST_PATH/frontend/hooks/"
cp -v frontend/lib/constants.ts "$DEST_PATH/frontend/lib/"

echo ""
echo "✅ Phase 12 files installed successfully!"
echo ""
echo "📚 New files added:"
echo "  • types/cyber.ts - Cyber intelligence types"
echo "  • lib/cyberIntelligence.ts - Analyzer"
echo "  • lib/cyberSampleData.ts - Data generator"
echo "  • hooks/useCyberIntelligence.ts - React hook"
echo "  • lib/constants.ts - Updated with cyber colors"
echo ""
echo "🎯 New capabilities:"
echo "  • IP node support (malicious detection, geolocation)"
echo "  • Threat actor modeling (APT, cybercrime, nation-state)"
echo "  • Vulnerability tracking (CVE, CVSS, exploits)"
echo "  • Attack path discovery"
echo "  • MITRE ATT&CK integration"
echo "  • Threat intelligence summaries"
echo ""
echo "📖 Usage example:"
echo "  import { useCyberIntelligence } from '@/hooks/useCyberIntelligence';"
echo "  const { getMaliciousIPs, getActiveThreats } = useCyberIntelligence();"
echo ""
echo "Generate sample data:"
echo "  import { generateCyberIntelGraph } from '@/lib/cyberSampleData';"
echo "  const data = generateCyberIntelGraph({ ipCount: 10, threatCount: 5 });"
echo ""
echo "See README.md for full documentation"
echo ""