#!/bin/zsh
# 双击此文件即可启动本地旅行指南；关闭此终端窗口即可停止服务。

set -u
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js。请先安装 Node.js 22 或更高版本，然后再双击此文件。"
  read "?按回车键关闭窗口…"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "正在安装首次运行所需的依赖…"
  npm install || {
    echo "依赖安装失败。请检查网络后重试。"
    read "?按回车键关闭窗口…"
    exit 1
  }
fi

# 替换仍占用端口的同项目旧服务，避免页面继续运行旧代码。
existing_pid="$(lsof -tiTCP:5173 -sTCP:LISTEN 2>/dev/null | head -n 1)"
if [[ -n "$existing_pid" ]]; then
  existing_cwd="$(lsof -a -p "$existing_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
  if [[ "$existing_cwd" == "$PWD" ]]; then
    echo "正在关闭旧版本服务…"
    kill "$existing_pid" 2>/dev/null
    for _ in {1..20}; do
      kill -0 "$existing_pid" 2>/dev/null || break
      sleep 0.1
    done
  else
    echo "端口 5173 已被其他程序占用，无法启动。"
    read "?按回车键关闭窗口…"
    exit 1
  fi
fi

echo "正在启动旅行指南…"
echo "页面地址：http://127.0.0.1:5173"
(sleep 2; open "http://127.0.0.1:5173") &
npm run dev
