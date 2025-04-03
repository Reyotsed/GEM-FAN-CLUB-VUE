#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 激活 Python 环境（如果你使用虚拟环境的话，取消下面这行的注释并修改路径）
# source /path/to/your/venv/bin/activate

# 运行 Python 脚本
python fetch_gem_songs.py

# 记录日志
echo "[$(date)] Updated songs data" >> update_songs.log 