#!/bin/bash
# Seamless 10s wind-sway loop (VP9 + alpha) for a 960x960 bloom square hanging from the top edge.
# usage: sway-sq.sh <n> [amp px]
n=$1; A=${2:-16}; out="../../assets/video/bloom-$n.webm"
w='pow(Y/H,1.4)'
dX="$A*$w*sin(2*PI*T/2.5+Y/H*1.8)+0.25*$A*$w*sin(2*PI*T/1.25+X/70+Y/50)"; dY="0.12*$A*$w*sin(2*PI*T/1.25+X/90)"
ffmpeg -v error -y -loop 1 -framerate 24 -i "bloom-$n.png" -t 10 \
  -vf "format=rgba,geq=r='r(X-($dX),Y-($dY))':g='g(X-($dX),Y-($dY))':b='b(X-($dX),Y-($dY))':a='alpha(X-($dX),Y-($dY))',format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 4 -an "$out"
