#!/bin/bash
set -e

# Generate crisp 512x512 doctor icon matching doctor.png
convert -size 512x512 xc:none \
  -fill "#ffffff" -stroke "#cbd5e1" -strokewidth 6 \
  -draw "roundrectangle 16,16 496,496 112,112" \
  \
  -fill none -stroke "#000000" -strokewidth 18 \
  -draw "stroke-linecap round stroke-linejoin round path 'M 155,160 C 150,65 210,35 256,35 C 302,35 362,65 357,160'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 160,135 C 190,95 235,120 256,105 C 277,120 322,95 352,135'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 165,155 C 138,155 138,205 165,205'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 347,155 C 374,155 374,205 347,205'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 165,190 C 165,250 200,285 256,285 C 312,285 347,250 347,190'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 215,278 L 215,315'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 297,278 L 297,315'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 215,315 L 256,375 L 297,315'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 256,375 L 256,485'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 215,315 C 160,315 65,365 52,435 C 45,475 75,485 130,485 L 382,485 C 437,485 467,475 460,435 C 447,365 352,315 297,315'" \
  -draw "stroke-linecap round stroke-linejoin round path 'M 158,328 C 145,345 138,375 138,405 C 138,435 178,435 178,390 L 178,370'" \
  -fill "#000000" -draw "circle 178,370 178,362" \
  -fill none \
  -draw "stroke-linecap round stroke-linejoin round path 'M 354,328 C 365,348 372,370 372,390'" \
  -draw "circle 372,410 372,434" \
  -fill "#000000" -draw "circle 372,410 372,420" \
  build/icon.png

# Copy to public/icon.png
cp build/icon.png public/icon.png

# Generate Windows ICO containing multi-resolutions: 256, 128, 64, 48, 32, 16
convert build/icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico

# Copy to public/favicon.ico
cp build/icon.ico public/favicon.ico

echo "Doctor icon successfully created in build/ and public/!"
