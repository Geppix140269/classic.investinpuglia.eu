#!/usr/bin/env python3
import re

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all corrupted character patterns
replacements = {
    '🏠"': '📐',  # Design
    '🏠"Š': '📊',  # Studies  
    '🏠Ž': '💰',  # Grant
    '🏠\'°': '💳',  # Tax Credit
    '🏠†': '✅',  # Total
    '🏠¢': '💼',  # Agency
    '🏠"': '📝',  # Registration
    '🏠\'¼': '👔',  # Consulting
    '🏠\'µ': '💵',  # Net Investment
    '🏠\'¬': '📧',  # Send Report
    '🏠"\'': '🔒',  # Secure
    # Additional fixes
    '🏠\'¥': '👥',  # Personnel
    '🏠"£': '📢',  # Marketing
    '🏠\'': '💼',  # Other costs
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed encoding issues')