#!/bin/sh
cd "$(dirname "$0")" || exit 1
node_path="$(command -v node)"
if [ -z "$node_path" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$candidate" ]; then node_path="$candidate"; break; fi
  done
fi
if [ -z "$node_path" ]; then
  echo "多人房間需要 Node.js 18 或以上版本。單人遊戲可直接開啟 index.html。"
  read -r line
  exit 1
fi
exec "$node_path" server.cjs
