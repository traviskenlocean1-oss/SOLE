#!/bin/bash
# Renders a seamless 10s wind-sway loop (VP9 with alpha) from a cut-out flower.
# usage: sway.sh <name> <anchor: top|bottom|right> <amp px> [seconds]
name=$1; anchor=$2; A=$3; dur=${4:-10}
src="../../assets/img/$name.webp"; out="../../assets/video/$name.webm"
magick "$src" -resize '900x900>' -bordercolor none -border 6% -resize '%[fx:2*floor(w/2)]x%[fx:2*floor(h/2)]!' "$name-pad.png"
case $anchor in
  top)    w='pow(Y/H,1.5)'; ax=X; ay=Y; dX="$A*$w*sin(2*PI*T/10+Y/H*1.8)+0.25*$A*$w*sin(2*PI*T/2.5+X/70+Y/50)"; dY="0.15*$A*$w*sin(2*PI*T/5+X/90)";;
  bottom) w='pow((H-Y)/H,1.5)'; dX="$A*$w*sin(2*PI*T/10+(H-Y)/H*1.8)+0.25*$A*$w*sin(2*PI*T/2.5+X/70+Y/50)"; dY="0.15*$A*$w*sin(2*PI*T/5+X/90)";;
  right)  w='pow((W-X)/W,1.5)'; dY="$A*$w*sin(2*PI*T/10+(W-X)/W*1.8)+0.25*$A*$w*sin(2*PI*T/2.5+X/50+Y/70)"; dX="0.15*$A*$w*sin(2*PI*T/5+Y/90)";;
esac
sx="X-($dX)"; sy="Y-($dY)"
ffmpeg -v error -y -loop 1 -framerate 24 -i "$name-pad.png" -t $dur \
  -vf "format=rgba,geq=r='r($sx,$sy)':g='g($sx,$sy)':b='b($sx,$sy)':a='alpha($sx,$sy)',format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 4 -an "$out"
ls -la "$out"
